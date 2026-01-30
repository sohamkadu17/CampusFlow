import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Resource } from '../models/Resource.model';
import { Booking } from '../models/Booking.model';
import { User } from '../models/User.model';
import { Event } from '../models/Event.model';

dotenv.config();

const sampleResources = [
  {
    name: 'Main Auditorium',
    type: 'hall',
    description: 'Large auditorium with modern audio-visual equipment',
    capacity: 500,
    location: 'Academic Block A, Ground Floor',
    features: ['Projector', 'Sound System', 'AC', 'Stage', 'Green Room', 'Lighting'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Seminar Hall 1',
    type: 'hall',
    description: 'Medium-sized seminar hall for workshops and presentations',
    capacity: 150,
    location: 'Academic Block B, 1st Floor',
    features: ['Projector', 'Whiteboard', 'AC', 'Wi-Fi'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Seminar Hall 2',
    type: 'hall',
    description: 'Smaller seminar hall ideal for panel discussions',
    capacity: 100,
    location: 'Academic Block B, 2nd Floor',
    features: ['Projector', 'Whiteboard', 'AC', 'Wi-Fi'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Open Air Theatre',
    type: 'hall',
    description: 'Outdoor venue for cultural events and large gatherings',
    capacity: 800,
    location: 'Central Campus',
    features: ['Stage', 'Sound System', 'Lighting', 'Seating Area'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Conference Room A',
    type: 'room',
    description: 'Professional meeting room for formal discussions',
    capacity: 30,
    location: 'Administration Building, 2nd Floor',
    features: ['Projector', 'Video Conferencing', 'AC', 'Wi-Fi', 'Whiteboard'],
    autoApprove: true,
    isAvailable: true,
  },
  {
    name: 'Computer Lab 1',
    type: 'lab',
    description: 'Computer lab with 60 workstations',
    capacity: 60,
    location: 'IT Block, Ground Floor',
    features: ['Computers', 'Projector', 'AC', 'Wi-Fi', 'Software Development Tools'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Sports Complex Indoor Hall',
    type: 'hall',
    description: 'Indoor sports facility for various activities',
    capacity: 200,
    location: 'Sports Complex',
    features: ['Sports Equipment', 'Sound System', 'Changing Rooms'],
    autoApprove: false,
    isAvailable: true,
  },
  {
    name: 'Exhibition Hall',
    type: 'hall',
    description: 'Large space for exhibitions and stalls',
    capacity: 300,
    location: 'Student Activity Center',
    features: ['Display Boards', 'Electricity Points', 'AC', 'Storage Area'],
    autoApprove: false,
    isAvailable: true,
  },
];

async function seedResourcesAndBookings() {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log('✅ Connected to MongoDB');

    // Get users and events for realistic bookings
    const users = await User.find({ role: { $in: ['organizer', 'admin'] } }).limit(5);
    const events = await Event.find({ status: { $in: ['approved', 'pending'] } }).limit(5);

    if (users.length === 0) {
      console.log('❌ No organizers found. Please create users first.');
      process.exit(1);
    }

    // Clear existing resources and bookings
    await Resource.deleteMany({});
    await Booking.deleteMany({});
    console.log('🧹 Cleared existing resources and bookings');

    // Insert sample resources
    const createdResources = await Resource.insertMany(sampleResources);
    console.log(`✅ Created ${createdResources.length} resources`);

    // Create sample bookings for the next 14 days
    const sampleBookings = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const clubs = [
      'Tech Club',
      'Cultural Committee',
      'Sports Club',
      'Entrepreneurship Cell',
      'IEEE Student Branch',
      'Drama Club',
      'Music Club',
      'Photography Club',
    ];

    for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
      const currentDate = new Date(today);
      currentDate.setDate(currentDate.getDate() + dayOffset);

      // Create 2-4 random bookings per day
      const bookingsPerDay = Math.floor(Math.random() * 3) + 2;

      for (let i = 0; i < bookingsPerDay; i++) {
        const resource = createdResources[Math.floor(Math.random() * createdResources.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const club = clubs[Math.floor(Math.random() * clubs.length)];
        const event = events.length > 0 ? events[Math.floor(Math.random() * events.length)] : null;

        // Random start hour between 9 AM and 5 PM
        const startHour = Math.floor(Math.random() * 8) + 9;
        const startTime = new Date(currentDate);
        startTime.setHours(startHour, 0, 0, 0);

        // Duration: 1-3 hours
        const duration = Math.floor(Math.random() * 3) + 1;
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + duration);

        const purposes = [
          'Workshop on Web Development',
          'Cultural Event Rehearsal',
          'Technical Seminar',
          'Club Meeting',
          'Guest Lecture',
          'Competition Finals',
          'Team Building Activity',
          'Project Presentation',
          'Coding Competition',
          'Cultural Performance',
        ];

        sampleBookings.push({
          resourceId: resource._id.toString(),
          userId: user._id.toString(),
          userName: user.name,
          clubName: club,
          eventId: event ? event._id.toString() : undefined,
          eventTitle: event ? event.title : undefined,
          startTime,
          endTime,
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          status: Math.random() > 0.3 ? 'approved' : 'pending', // 70% approved, 30% pending
          approvedAt: Math.random() > 0.3 ? new Date() : undefined,
          notes: 'Auto-generated sample booking for testing',
        });
      }
    }

    const createdBookings = await Booking.insertMany(sampleBookings);
    console.log(`✅ Created ${createdBookings.length} sample bookings`);

    console.log('\n📊 Sample Data Summary:');
    console.log(`   Resources: ${createdResources.length}`);
    console.log(`   Bookings: ${createdBookings.length}`);
    console.log(`   Date Range: Today to ${new Date(today.getTime() + 13 * 24 * 60 * 60 * 1000).toDateString()}`);

    console.log('\n✅ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seedResourcesAndBookings();
