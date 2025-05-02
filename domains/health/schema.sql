-- Health analysis table to store AI-generated analyses
CREATE TABLE IF NOT EXISTS health_analysis (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER NOT NULL REFERENCES plant(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Basic health metrics (calculated)
    overall_status VARCHAR(50) NOT NULL,
    average_score DECIMAL(5, 2) NOT NULL,
    
    -- AI analysis results (JSON storage)
    ai_summary TEXT,
    ai_recommendations JSONB,
    ai_prediction_trend VARCHAR(20),
    ai_prediction_score INTEGER,
    ai_prediction_explanation TEXT,
    ai_potential_issues JSONB,
    ai_optimal_conditions JSONB,
    
    -- Raw AI response (for debugging/future use)
    raw_ai_response JSONB,
    
    -- Create a unique constraint to prevent duplicates
    UNIQUE(plant_id, start_date, end_date)
); 