-- Create Training Evaluation Form Table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'TrainingEvaluationForms')
BEGIN
  CREATE TABLE TrainingEvaluationForms (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    employee_id BIGINT NOT NULL,
    training_id BIGINT NOT NULL,
    course_title NVARCHAR(255),
    resource_speaker NVARCHAR(255),
    participant_name NVARCHAR(255),
    training_date DATETIME,
    position NVARCHAR(255),
    venue NVARCHAR(255),
    
    -- Page 1: Program Contents (5 criteria)
    program_1_rating INT,
    program_2_rating INT,
    program_3_rating INT,
    program_4_rating INT,
    program_5_rating INT,
    
    -- Page 1: Trainer/Speaker (5 criteria)
    trainer_1_rating INT,
    trainer_2_rating INT,
    trainer_3_rating INT,
    trainer_4_rating INT,
    trainer_5_rating INT,
    
    -- Page 1: Transfer Quotient (5 criteria)
    transfer_1_rating INT,
    transfer_2_rating INT,
    transfer_3_rating INT,
    transfer_4_rating INT,
    transfer_5_rating INT,
    
    -- Page 1: Scores
    overall_score INT,
    total_average_score DECIMAL(5,2),
    page1_remarks_1 NVARCHAR(MAX),
    page1_remarks_2 NVARCHAR(MAX),
    overall_remarks NVARCHAR(MAX),
    
    -- Page 2: Applied Skills Before (5 criteria)
    applied_before_1_rating INT,
    applied_before_2_rating INT,
    applied_before_3_rating INT,
    applied_before_4_rating INT,
    applied_before_5_rating INT,
    applied_before_total INT,
    applied_before_avg DECIMAL(5,2),
    
    -- Page 2: Applied Skills After (5 criteria)
    applied_after_1_rating INT,
    applied_after_2_rating INT,
    applied_after_3_rating INT,
    applied_after_4_rating INT,
    applied_after_5_rating INT,
    applied_after_total INT,
    applied_after_avg DECIMAL(5,2),
    
    -- Page 2: Business Results (3 criteria)
    business_1_rating INT,
    business_1_feedback NVARCHAR(MAX),
    business_2_rating INT,
    business_2_feedback NVARCHAR(MAX),
    business_3_rating INT,
    business_3_feedback NVARCHAR(MAX),
    business_total INT,
    business_avg DECIMAL(5,2),
    
    -- Page 2: Remarks
    page2_remarks_1 NVARCHAR(MAX),
    page2_remarks_2 NVARCHAR(MAX),
    
    -- Signatures
    rated_by_name NVARCHAR(255),
    rated_by_date DATETIME,
    received_by_name NVARCHAR(255),
    received_by_date DATETIME,
    
    -- Metadata
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    created_by NVARCHAR(255),
    updated_by NVARCHAR(255),
    
    FOREIGN KEY (employee_id) REFERENCES Employees(id),
    FOREIGN KEY (training_id) REFERENCES TrainingRecords(id)
  );
  
  CREATE INDEX idx_employee_training ON TrainingEvaluationForms(employee_id, training_id);
  CREATE INDEX idx_created_at ON TrainingEvaluationForms(created_at);
  
  PRINT 'TrainingEvaluationForms table created successfully';
END
ELSE
BEGIN
  PRINT 'TrainingEvaluationForms table already exists';
END;
