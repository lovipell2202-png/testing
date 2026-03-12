USE NSB_Training;

-- ============================================================================
-- Create Users table for authentication
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Users')
BEGIN
    CREATE TABLE Users (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        employee_id BIGINT NOT NULL,
        username NVARCHAR(100) UNIQUE NOT NULL,
        password_hash NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL DEFAULT 'employee', -- admin, manager, employee
        is_active BIT DEFAULT 1,
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (employee_id) REFERENCES Employees(id)
    );
    
    -- Create indexes for Users table
    CREATE INDEX idx_users_username ON Users(username);
    CREATE INDEX idx_users_employee_id ON Users(employee_id);
    CREATE INDEX idx_users_role ON Users(role);
    
    PRINT '✅ Users table created successfully';
END
ELSE
BEGIN
    PRINT '✅ Users table already exists';
END

-- ============================================================================
-- Create Sessions table for tracking active sessions
-- ============================================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Sessions')
BEGIN
    CREATE TABLE Sessions (
        id BIGINT PRIMARY KEY IDENTITY(1,1),
        user_id BIGINT NOT NULL,
        session_token NVARCHAR(255) UNIQUE NOT NULL,
        ip_address NVARCHAR(50),
        user_agent NVARCHAR(500),
        created_at DATETIME DEFAULT GETDATE(),
        expires_at DATETIME,
        FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
    );
    
    -- Create indexes for Sessions table
    CREATE INDEX idx_sessions_user_id ON Sessions(user_id);
    CREATE INDEX idx_sessions_token ON Sessions(session_token);
    CREATE INDEX idx_sessions_expires_at ON Sessions(expires_at);
    
    PRINT '✅ Sessions table created successfully';
END
ELSE
BEGIN
    PRINT '✅ Sessions table already exists';
END

-- ============================================================================
-- Insert admin user for Employee No. 1 (for testing)
-- ============================================================================
IF NOT EXISTS (SELECT * FROM Users WHERE username = 'admin')
BEGIN
    -- Get the first employee (Employee #1)
    DECLARE @employee_id BIGINT;
    SELECT TOP 1 @employee_id = id FROM Employees ORDER BY id;
    
    IF @employee_id IS NOT NULL
    BEGIN
        INSERT INTO Users (employee_id, username, password_hash, role, is_active)
        VALUES (@employee_id, 'admin', 'ADMIN123', 'admin', 1);
        
        PRINT '✅ Admin account created for Employee #1 (username: admin, password: ADMIN123)';
    END
    ELSE
    BEGIN
        PRINT '❌ No employees found in database';
    END
END
ELSE
BEGIN
    PRINT '✅ Admin account already exists';
END

PRINT '';
PRINT '✅ Authentication setup completed successfully!';
PRINT '';
PRINT '📋 Summary:';
PRINT '   - Users table ready';
PRINT '   - Sessions table ready';
PRINT '   - Admin account configured for Employee #1';
PRINT '';
PRINT '🔐 Test Credentials:';
PRINT '   - Username: admin';
PRINT '   - Password: ADMIN123';
PRINT '   - Role: admin';
