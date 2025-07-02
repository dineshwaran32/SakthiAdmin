import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import Employee from '../models/Employee.js';
import Notification from '../models/Notification.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// Get all employees with pagination and filtering
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, department, search, sortBy = 'creditPoints', sortOrder = 'desc' } = req.query;
    
    const query = { isActive: true };
    
    if (department && department !== 'all') {
      query.department = department;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const employees = await Employee.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Employee.countDocuments(query);
    const departments = await Employee.distinct('department', { isActive: true });

    res.json({
      employees,
      total,
      departments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get employee by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee || !employee.isActive) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new employee
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employee = new Employee(req.body);
    await employee.save();
    
    // Create notification
    await Notification.create({
      type: 'system_update',
      title: 'New Employee Added',
      message: `Employee ${employee.name} (${employee.employeeNumber}) has been added to the system`,
      recipientRole: 'admin'
    });

    res.status(201).json(employee);
  } catch (error) {
    if (error.code === 11000) {
      const duplicateField = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        message: `Employee with this ${duplicateField} already exists` 
      });
    }
    console.error('Create employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee credit points
router.patch('/:id/credits', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { creditPoints, reason } = req.body;
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { creditPoints },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Create notification
    await Notification.create({
      type: 'credit_points_updated',
      title: 'Credit Points Updated',
      message: `Your credit points have been updated to ${creditPoints}. ${reason || ''}`,
      recipientEmployeeNumber: employee.employeeNumber
    });

    res.json(employee);
  } catch (error) {
    console.error('Update credits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete employee
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk import employees from Excel
router.post('/bulk-import', authenticateToken, requireAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    const employees = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const employee = new Employee({
          employeeNumber: row.employeeNumber || row['Employee Number'],
          name: row.name || row['Name'],
          email: row.email || row['Email'],
          department: row.department || row['Department'],
          phoneNumber: row.phoneNumber || row['Phone Number'],
          creditPoints: row.creditPoints || row['Credit Points'] || 0
        });

        await employee.validate();
        employees.push(employee);
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: 'Validation errors', errors });
    }

    const savedEmployees = await Employee.insertMany(employees);
    
    // Create notification
    await Notification.create({
      type: 'system_update',
      title: 'Bulk Employee Import',
      message: `${savedEmployees.length} employees have been imported successfully`,
      recipientRole: 'admin'
    });

    res.json({
      message: `Successfully imported ${savedEmployees.length} employees`,
      employees: savedEmployees
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export employees to Excel
router.get('/export/excel', authenticateToken, async (req, res) => {
  try {
    const employees = await Employee.find({ isActive: true }).lean();
    
    const data = employees.map(emp => ({
      'Employee Number': emp.employeeNumber,
      'Name': emp.name,
      'Email': emp.email,
      'Department': emp.department,
      'Role': emp.role,
      'Credit Points': emp.creditPoints,
      'Phone Number': emp.phoneNumber || '',
      'Joining Date': emp.joiningDate ? emp.joiningDate.toISOString().split('T')[0] : '',
      'Created At': emp.createdAt ? emp.createdAt.toISOString().split('T')[0] : ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    
    res.setHeader('Content-Disposition', 'attachment; filename=employees.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;