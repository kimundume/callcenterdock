// MongoDB initialization script for CallDocker
// This script runs when the MongoDB container starts for the first time

// Create the main database
db = db.getSiblingDB('calldocker');

// Create collections with proper indexes
db.createCollection('companies');
db.createCollection('users');
db.createCollection('agents');
db.createCollection('calls');
db.createCollection('widgets');
db.createCollection('sessions');

// Create indexes for better performance
db.companies.createIndex({ "uuid": 1 }, { unique: true });
db.companies.createIndex({ "email": 1 }, { unique: true });
db.companies.createIndex({ "domain": 1 });

db.users.createIndex({ "email": 1 }, { unique: true });
db.users.createIndex({ "companyUuid": 1 });
db.users.createIndex({ "role": 1 });

db.agents.createIndex({ "username": 1, "companyUuid": 1 }, { unique: true });
db.agents.createIndex({ "companyUuid": 1 });
db.agents.createIndex({ "status": 1 });

db.calls.createIndex({ "callId": 1 }, { unique: true });
db.calls.createIndex({ "companyUuid": 1 });
db.calls.createIndex({ "agentId": 1 });
db.calls.createIndex({ "status": 1 });
db.calls.createIndex({ "createdAt": 1 });

db.widgets.createIndex({ "companyUuid": 1 }, { unique: true });
db.widgets.createIndex({ "widgetId": 1 }, { unique: true });

db.sessions.createIndex({ "sessionId": 1 }, { unique: true });
db.sessions.createIndex({ "userId": 1 });
db.sessions.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

// Create a default super admin user
db.users.insertOne({
    email: "admin@calldocker.com",
    password: "$2a$10$rQZ8K9mN2pL1vX3yJ6hF8eS4tU7wA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2x",
    role: "super_admin",
    companyUuid: "calldocker-company-uuid",
    firstName: "Super",
    lastName: "Admin",
    isVerified: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create default CallDocker company
db.companies.insertOne({
    uuid: "calldocker-company-uuid",
    name: "CallDocker",
    email: "admin@calldocker.com",
    domain: "calldocker.com",
    isVerified: true,
    isActive: true,
    subscription: "enterprise",
    maxAgents: 100,
    maxCalls: 10000,
    createdAt: new Date(),
    updatedAt: new Date()
});

// Create default CallDocker agents
db.agents.insertMany([
    {
        username: "calldocker-agent-1",
        password: "$2a$10$rQZ8K9mN2pL1vX3yJ6hF8eS4tU7wA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2x",
        companyUuid: "calldocker-company-uuid",
        firstName: "CallDocker",
        lastName: "Agent 1",
        email: "agent1@calldocker.com",
        role: "agent",
        status: "available",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        username: "calldocker-agent-2",
        password: "$2a$10$rQZ8K9mN2pL1vX3yJ6hF8eS4tU7wA1bC2dE3fG4hI5jK6lM7nO8pQ9rS0tU1vW2x",
        companyUuid: "calldocker-company-uuid",
        firstName: "CallDocker",
        lastName: "Agent 2",
        email: "agent2@calldocker.com",
        role: "agent",
        status: "available",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]);

// Create default widget configuration
db.widgets.insertOne({
    companyUuid: "calldocker-company-uuid",
    widgetId: "calldocker-widget-default",
    config: {
        title: "Call Us",
        subtitle: "Speak with our team",
        buttonText: "Start Call",
        buttonColor: "#007bff",
        position: "bottom-right",
        fallbackToCallDocker: true
    },
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
});

print("MongoDB initialization completed successfully!");
print("Default super admin: admin@calldocker.com");
print("Default CallDocker agents created");
print("Database 'calldocker' is ready for use"); 