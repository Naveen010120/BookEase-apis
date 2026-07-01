require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = require('./Models/User');
const Hostel = require('./Models/Hostel');
const Room = require('./Models/Room');
const Booking = require('./Models/Booking');
const Review = require('./Models/Review');

async function seed() {
  await mongoose.connect(process.env.MONGO_URL.replace('<database>', 'bookease'));

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Hostel.deleteMany({}),
    Room.deleteMany({}),
    Booking.deleteMany({}),
    Review.deleteMany({}),
  ]);

  const hash = (p) => bcrypt.hash(p, 10);

  // --- Users ---
  const [adminPass, owner1Pass, owner2Pass, user1Pass, user2Pass] = await Promise.all([
    hash('Admin@123'), hash('Owner@123'), hash('Owner@123'), hash('User@123'), hash('User@123'),
  ]);

  const [admin, owner1, owner2, user1, user2] = await User.insertMany([
    { name: 'Admin User',    email: 'admin@bookease.com',  password: adminPass,  role: 'admin',  phone: '9000000001', isVerified: true },
    { name: 'Ravi Sharma',   email: 'ravi@bookease.com',   password: owner1Pass, role: 'owner',  phone: '9000000002', isVerified: true },
    { name: 'Priya Nair',    email: 'priya@bookease.com',  password: owner2Pass, role: 'owner',  phone: '9000000003', isVerified: true },
    { name: 'Arjun Mehta',   email: 'arjun@bookease.com',  password: user1Pass,  role: 'user',   phone: '9000000004', isVerified: true },
    { name: 'Sneha Reddy',   email: 'sneha@bookease.com',  password: user2Pass,  role: 'user',   phone: '9000000005', isVerified: true },
  ]);

  // --- Hostels ---
  const [hostel1, hostel2, hostel3] = await Hostel.insertMany([
    {
      owner: owner1._id,
      hostelName: 'Green Valley Boys Hostel',
      description: 'A comfortable and affordable hostel for male students near IIT Delhi.',
      address: '12, Hauz Khas Village',
      city: 'Delhi',
      state: 'Delhi',
      country: 'India',
      gender: 'male',
      amenities: ['WiFi', 'Laundry', 'Mess', 'CCTV', 'Power Backup', 'Parking'],
      rules: ['No smoking', 'No alcohol', 'Visitors allowed till 9 PM', 'Gate closes at 11 PM'],
      nearbyUniversities: ['IIT Delhi', 'JNU'],
      contactPhone: '9100000001',
      contactEmail: 'greenvalley@bookease.com',
      isApproved: true,
      isActive: true,
      averageRating: 4.2,
      totalReviews: 2,
      startingPrice: 5000,
    },
    {
      owner: owner1._id,
      hostelName: 'Sunrise Girls Hostel',
      description: 'Safe and secure hostel exclusively for female students in Pune.',
      address: '45, FC Road',
      city: 'Pune',
      state: 'Maharashtra',
      country: 'India',
      gender: 'female',
      amenities: ['WiFi', 'Mess', 'CCTV', 'Biometric Entry', 'Hot Water', 'Study Room'],
      rules: ['No male visitors inside', 'Gate closes at 10 PM', 'No loud music after 10 PM'],
      nearbyUniversities: ['Pune University', 'Symbiosis'],
      contactPhone: '9100000002',
      contactEmail: 'sunrise@bookease.com',
      isApproved: true,
      isActive: true,
      averageRating: 4.5,
      totalReviews: 1,
      startingPrice: 6000,
    },
    {
      owner: owner2._id,
      hostelName: 'Urban Nest Co-ed Hostel',
      description: 'Modern co-ed hostel with premium amenities in Bangalore tech hub.',
      address: '78, Koramangala 5th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      country: 'India',
      gender: 'co-ed',
      amenities: ['WiFi', 'AC', 'Gym', 'Cafeteria', 'Rooftop', 'Housekeeping'],
      rules: ['No smoking inside rooms', 'Guests allowed in common areas only', 'Quiet hours after 11 PM'],
      nearbyUniversities: ['Christ University', 'BITS Pilani Bangalore'],
      contactPhone: '9100000003',
      contactEmail: 'urbannest@bookease.com',
      isApproved: false,
      isActive: true,
      startingPrice: 9000,
    },
  ]);

  // --- Rooms ---
  const [room1, room2, room3, room4, room5] = await Room.insertMany([
    { hostel: hostel1._id, roomType: 'single',    sharing: 1, totalBeds: 5,  availableBeds: 3, monthlyPrice: 8000, isAC: false, features: ['Attached Bathroom', 'Study Table', 'Wardrobe'] },
    { hostel: hostel1._id, roomType: 'double',    sharing: 2, totalBeds: 10, availableBeds: 6, monthlyPrice: 5000, isAC: false, features: ['Study Table', 'Wardrobe', 'Fan'] },
    { hostel: hostel2._id, roomType: 'single',    sharing: 1, totalBeds: 4,  availableBeds: 2, monthlyPrice: 9000, isAC: true,  features: ['Attached Bathroom', 'AC', 'Study Table', 'Wardrobe'] },
    { hostel: hostel2._id, roomType: 'triple',    sharing: 3, totalBeds: 9,  availableBeds: 5, monthlyPrice: 6000, isAC: false, features: ['Common Bathroom', 'Study Table', 'Fan'] },
    { hostel: hostel3._id, roomType: 'dormitory', sharing: 6, totalBeds: 12, availableBeds: 8, monthlyPrice: 9000, isAC: true,  features: ['AC', 'Locker', 'Common Bathroom'] },
  ]);

  // --- Bookings ---
  const checkIn1 = new Date('2025-06-01');
  const checkOut1 = new Date('2025-08-31');
  const checkIn2 = new Date('2025-07-01');
  const checkOut2 = new Date('2025-09-30');

  const [booking1, booking2] = await Booking.insertMany([
    {
       bookingId: "BK100001",
      user: user1._id,
      hostel: hostel1._id,
      room: room2._id,
      checkIn: checkIn1,
      checkOut: checkOut1,
      guestName: 'Arjun Mehta',
      guestPhone: '9000000004',
      emergencyContact: '9000000010',
      totalAmount: 15000,
      bookingStatus: 'confirmed',
      paymentStatus: 'paid',
      paymentId: 'PAY_SEED_001',
    },
    {
      bookingId: "BK100002",
      user: user2._id,
      hostel: hostel2._id,
      room: room3._id,
      checkIn: checkIn2,
      checkOut: checkOut2,
      guestName: 'Sneha Reddy',
      guestPhone: '9000000005',
      emergencyContact: '9000000011',
      totalAmount: 27000,
      bookingStatus: 'pending',
      paymentStatus: 'unpaid',
    },
  ]);

  // --- Reviews ---
  await Review.insertMany([
    {
      user: user1._id,
      hostel: hostel1._id,
      rating: 4,
      comment: 'Good hostel with clean rooms and decent food. WiFi could be faster.',
      likes: [],
    },
    {
      user: user2._id,
      hostel: hostel1._id,
      rating: 5,
      comment: 'Excellent staff and very safe environment. Highly recommended!',
      likes: [user1._id],
    },
    {
      user: user1._id,
      hostel: hostel2._id,
      rating: 5,
      comment: 'Best girls hostel in Pune. Very secure and well maintained.',
      likes: [],
    },
  ]);

  console.log('✅ Seed completed successfully!\n');
  console.log('Login credentials:');
  console.log('  Admin  → admin@bookease.com  / Admin@123');
  console.log('  Owner1 → ravi@bookease.com   / Owner@123');
  console.log('  Owner2 → priya@bookease.com  / Owner@123');
  console.log('  User1  → arjun@bookease.com  / User@123');
  console.log('  User2  → sneha@bookease.com  / User@123');

  await mongoose.disconnect();
}

seed().catch((err) => { console.error('❌ Seed failed:', err); process.exit(1); });
