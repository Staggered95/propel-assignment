-- Create the poles table
CREATE TABLE poles (
    pole_id VARCHAR(50) PRIMARY KEY,
    lat DECIMAL(9,6) NOT NULL,
    lon DECIMAL(9,6) NOT NULL,
    feeder_id VARCHAR(50) NOT NULL,
    dt_id VARCHAR(50) NOT NULL,
    
    -- Topology (NULL for the 60% missing cases)
    seq_on_line INTEGER,
    parent_pole_id VARCHAR(50) REFERENCES poles(pole_id), 
    
    device_id VARCHAR(50), 
    ward VARCHAR(50),
    pincode VARCHAR(10),
    
    -- Active State
    is_live BOOLEAN DEFAULT TRUE,
    last_event_ts TIMESTAMP,
    last_event_seq INTEGER
);

-- Create the tickets table
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    dt_id VARCHAR(50),
    fault_type VARCHAR(20) NOT NULL, -- 'SPAN', 'DT', 'FEEDER'
    target_id VARCHAR(50) NOT NULL,  -- e.g., 'P-102_P-104' or 'D-0112'
    status VARCHAR(20) DEFAULT 'DETECTED', 
    affected_count INTEGER,
    pincode VARCHAR(10),
    lat DECIMAL(9,6),
    lon DECIMAL(9,6),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP
);
