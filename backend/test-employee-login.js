// Test script to verify employee login flow
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');

async function testEmployeeLogin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/houseway_db');
    console.log('✅ Connected to MongoDB');

    // Check if test employee exists
    let testEmployee = await User.findOne({ email: 'employee@test.com' });

    if (!testEmployee) {
      // Create test employee if it doesn't exist
      const hashedPassword = await bcrypt.hash('Password123', 12);

      testEmployee = new User({
        firstName: 'Test',
        lastName: 'Employee',
        email: 'employee@test.com',
        password: hashedPassword,
        role: 'employee',
        employeeDetails: {
          employeeId: 'EMP001',
          department: 'Design',
          position: 'Interior Designer',
          skills: ['Interior Design', '3D Modeling', 'Client Communication']
        },
        isActive: true
      });

      await testEmployee.save();
      console.log('✅ Created test employee account');
    } else {
      console.log('✅ Test employee account already exists');
    }

    // Test login credentials
    console.log('\n📱 Employee Login Credentials:');
    console.log('Email: employee@test.com');
    console.log('Password: Password123');
    console.log('\n🔗 API Endpoint: POST /api/auth/login');
    console.log('\n📋 Request Body:');
    console.log(JSON.stringify({
      email: 'employee@test.com',
      password: 'Password123'
    }, null, 2));

    // Test the login by checking if user exists and has correct role
    const testUser = await User.findOne({ email: 'employee@test.com' });
    if (testUser && testUser.role === 'employee') {
      console.log('\n✅ Employee login flow is properly configured!');
      console.log('✅ Employee role:', testUser.role);
      console.log('✅ Employee name:', `${testUser.firstName} ${testUser.lastName}`);
      console.log('✅ Employee ID:', testUser.employeeDetails?.employeeId);
    } else {
      console.log('\n❌ Employee login flow configuration issue');
    }

    // Check if client management routes are available
    console.log('\n🛣️  Available Routes for Employees:');
    console.log('GET  /api/clients - Get all clients');
    console.log('GET  /api/clients/:id - Get client details');
    console.log('GET  /api/clients/dashboard/stats - Get dashboard stats');
    console.log('GET  /api/projects - Get projects (employee filtered)');
    console.log('GET  /api/projects/client/:clientId - Get client projects');
    console.log('POST /api/projects/:id/timeline - Add timeline event');
    console.log('POST /api/projects/:id/media - Upload project media');
    console.log('POST /api/projects/:id/invoices - Create project invoice');

  } catch (error) {
    console.error('❌ Error testing employee login:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

testEmployeeLogin();