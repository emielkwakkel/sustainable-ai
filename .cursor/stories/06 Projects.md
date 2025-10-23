# Projects Feature - User Story

## Overview
The Projects feature enables users to organize and track carbon emissions from AI model usage across multiple projects. Users can create projects, add token calculations, import usage data from Cursor API, and monitor environmental impact over time with detailed dashboards and analytics.

## User Story

### Main Story
As a sustainability manager or AI developer
I want to organize my AI model usage into projects with detailed carbon tracking
So that I can monitor environmental impact across different initiatives and make data-driven decisions about AI usage patterns

### Supporting Stories

#### Project Management
As a project manager
I want to create and manage multiple AI projects
So that I can track carbon emissions separately for different initiatives, clients, or use cases

#### Data Import
As a developer using Cursor
I want to import my actual usage data from Cursor API
So that I can get accurate carbon calculations based on real usage patterns rather than estimates

#### Analytics & Reporting
As a sustainability manager
I want to see detailed analytics and trends for each project
So that I can identify usage patterns and opportunities for optimization

## Acceptance Criteria

### Project Creation & Management
- [ ] User can create a new project with name, description, and calculation preset
- [ ] User can view a projects dashboard showing all projects with total CO₂ emissions
- [ ] User can edit project details (name, description, preset)
- [ ] User can delete projects with confirmation
- [ ] User can duplicate projects with all settings and calculations

### Token Calculation Management
- [ ] User can add token calculation rows to a project
- [ ] User can edit existing calculation rows (token count, model, parameters)
- [ ] User can delete calculation rows with confirmation
- [ ] User can bulk import token calculations from CSV/JSON
- [ ] System automatically calculates emissions using the project's preset configuration

### Cursor API Integration
- [ ] User can configure Cursor API token in settings
- [ ] User can test API connection to verify credentials
- [ ] User can import usage data by selecting date range
- [ ] System parses Cursor usage data and creates calculation rows
- [ ] User can preview imported data before confirming
- [ ] System handles API rate limits and errors gracefully

### Project Dashboard
- [ ] Dashboard shows total CO₂ emissions for the project
- [ ] Dashboard shows total energy consumption for the project
- [ ] Dashboard displays chart of emissions over time
- [ ] Dashboard displays chart of energy consumption over time
- [ ] Dashboard shows breakdown by model type and usage patterns
- [ ] User can filter data by date range, model, or other criteria

### Data Recalculation
- [ ] User can recalculate all rows in a project when algorithm improves
- [ ] User can recalculate specific rows individually
- [ ] System preserves original calculation parameters
- [ ] System shows before/after comparison for recalculations
- [ ] User can export recalculated data

## User Experience Flow

### Creating a New Project
1. User navigates to Projects dashboard
2. User clicks "Create New Project" button
3. User enters project name and description
4. User selects calculation preset (GPT-4, Claude, etc.)
5. User clicks "Create Project"
6. System creates project and redirects to project dashboard

### Adding Token Calculations
1. User opens a project dashboard
2. User clicks "Add Calculation" button
3. User enters token count and selects model
4. User adjusts calculation parameters if needed
5. User clicks "Add to Project"
6. System calculates emissions and adds row to project
7. Dashboard updates with new totals and charts

### Importing from Cursor API
1. User goes to project dashboard
2. User clicks "Import from Cursor" button
3. User selects date range for import
4. User clicks "Fetch Data" to retrieve usage
5. System shows preview of data to be imported
6. User reviews and confirms import
7. System creates calculation rows for each usage entry
8. Dashboard updates with imported data

### Viewing Project Analytics
1. User opens project dashboard
2. User sees total emissions and energy consumption
3. User can view charts showing trends over time
4. User can filter data by date, model, or other criteria
5. User can export project data for reporting

## Success Metrics

### User Engagement
- Number of projects created per user
- Frequency of data imports from Cursor API
- Time spent in project dashboards
- Number of calculations added per project

### Data Accuracy
- Percentage of calculations using real usage data vs estimates
- Accuracy of imported data from Cursor API
- Success rate of API connections and data imports

### Environmental Impact
- Total CO₂ emissions tracked across all projects
- Reduction in estimated vs actual emissions
- Number of recalculations performed after algorithm updates

## Edge Cases

### API Integration Issues
- Cursor API token expires or becomes invalid
- API rate limits exceeded during large data imports
- Network connectivity issues during import
- Invalid or malformed data returned from API

### Data Management
- User tries to delete project with many calculations
- User imports duplicate data from Cursor API
- Calculation algorithm changes affect existing data
- User exceeds storage limits for project data

### User Experience
- User creates project but forgets to set calculation preset
- User imports data but calculation fails due to invalid parameters
- User tries to recalculate but original parameters are missing
- User navigates away during long data import process

## Future Enhancements

### Advanced Analytics
- Predictive modeling for future emissions based on usage patterns
- Comparative analysis between projects
- Benchmarking against industry standards
- Automated recommendations for optimization

### Integration Expansion
- Support for other AI development platforms (GitHub Copilot, Replit, etc.)
- Integration with CI/CD pipelines for automated tracking
- Real-time monitoring of active development sessions
- Team collaboration features for shared projects

### Reporting & Compliance
- Automated sustainability reports for stakeholders
- Compliance tracking for carbon offset programs
- Integration with corporate sustainability platforms
- Export capabilities for audit and reporting purposes

## Technical Considerations

### Data Storage
- Efficient storage of large amounts of calculation data
- Backup and recovery for project data
- Data retention policies for historical calculations
- Performance optimization for large projects

### API Management
- Secure storage of Cursor API tokens
- Rate limiting and throttling for API calls
- Error handling and retry logic
- Data validation and sanitization

### User Interface
- Responsive design for mobile and desktop
- Intuitive navigation between projects
- Clear visualization of complex data
- Accessibility compliance for all features

## PostgreSQL Implementation Details

### Database Schema Design

#### Core Tables
```sql
-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    calculation_preset_id VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL
);

-- Token calculations table
CREATE TABLE calculations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    token_count INTEGER NOT NULL,
    model VARCHAR(100) NOT NULL,
    context_length INTEGER,
    context_window INTEGER,
    hardware VARCHAR(100),
    data_center_provider VARCHAR(100),
    data_center_region VARCHAR(100),
    custom_pue DECIMAL(3,2),
    custom_carbon_intensity DECIMAL(6,4),
    calculation_parameters JSONB,
    results JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cursor API imports table
CREATE TABLE cursor_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    raw_data JSONB NOT NULL,
    imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending'
);

-- User settings table
CREATE TABLE user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    cursor_api_token TEXT,
    preferences JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### Indexes for Performance
```sql
-- Projects indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Calculations indexes
CREATE INDEX idx_calculations_project_id ON calculations(project_id);
CREATE INDEX idx_calculations_created_at ON calculations(created_at);
CREATE INDEX idx_calculations_model ON calculations(model);
CREATE INDEX idx_calculations_results_gin ON calculations USING GIN (results);

-- Cursor imports indexes
CREATE INDEX idx_cursor_imports_project_id ON cursor_imports(project_id);
CREATE INDEX idx_cursor_imports_date_range ON cursor_imports(start_date, end_date);
CREATE INDEX idx_cursor_imports_raw_data_gin ON cursor_imports USING GIN (raw_data);
```

#### Views for Analytics
```sql
-- Project summary view
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.created_at,
    COUNT(c.id) as calculation_count,
    SUM(c.results->>'totalEmissionsGrams')::DECIMAL as total_emissions_grams,
    SUM(c.results->>'energyJoules')::DECIMAL as total_energy_joules,
    AVG(c.results->>'carbonEmissionsGrams')::DECIMAL as avg_emissions_per_token
FROM projects p
LEFT JOIN calculations c ON p.id = c.project_id
GROUP BY p.id, p.name, p.description, p.created_at;

-- Monthly emissions view
CREATE VIEW monthly_emissions AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    DATE_TRUNC('month', c.created_at) as month,
    SUM(c.results->>'totalEmissionsGrams')::DECIMAL as monthly_emissions_grams,
    SUM(c.results->>'energyJoules')::DECIMAL as monthly_energy_joules,
    COUNT(c.id) as calculation_count
FROM projects p
JOIN calculations c ON p.id = c.project_id
GROUP BY p.id, p.name, DATE_TRUNC('month', c.created_at);
```

### JSONB Data Structure

#### Calculation Results JSONB Format
```json
{
  "energyJoules": 673200.5,
  "energyKWh": 0.000187,
  "carbonEmissionsGrams": 0.0859,
  "totalEmissionsGrams": 85.9,
  "equivalentLightbulbMinutes": 1.12,
  "equivalentCarMiles": 0.037,
  "equivalentTreeHours": 3.9,
  "calculationVersion": "1.0.0",
  "algorithmHash": "sha256:abc123..."
}
```

#### Cursor API Data JSONB Format
```json
{
  "importMetadata": {
    "startDate": "2025-09-18T00:00:00Z",
    "endDate": "2025-09-18T23:59:59Z",
    "totalRecords": 150,
    "importedAt": "2025-09-19T10:30:00Z"
  },
  "usageData": [
    {
      "date": "2025-09-18T13:08:06.454Z",
      "kind": "free",
      "model": "auto",
      "maxMode": "No",
      "inputTokens": 2942,
      "outputTokens": 2931,
      "totalTokens": 140913,
      "cost": 0.06
    }
  ]
}
```

### Database Functions

#### Recalculation Function
```sql
CREATE OR REPLACE FUNCTION recalculate_project_emissions(
    project_uuid UUID,
    new_algorithm_version VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    calculation_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    FOR calculation_record IN 
        SELECT id, calculation_parameters, results
        FROM calculations 
        WHERE project_id = project_uuid
    LOOP
        -- Update calculation with new algorithm
        UPDATE calculations 
        SET 
            results = jsonb_set(
                results, 
                '{calculationVersion}', 
                to_jsonb(new_algorithm_version)
            ),
            updated_at = NOW()
        WHERE id = calculation_record.id;
        
        updated_count := updated_count + 1;
    END LOOP;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;
```

#### Analytics Aggregation Function
```sql
CREATE OR REPLACE FUNCTION get_project_analytics(
    project_uuid UUID,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'totalEmissionsGrams', COALESCE(SUM((results->>'totalEmissionsGrams')::DECIMAL), 0),
        'totalEnergyJoules', COALESCE(SUM((results->>'energyJoules')::DECIMAL), 0),
        'averageEmissionsPerToken', COALESCE(AVG((results->>'carbonEmissionsGrams')::DECIMAL), 0),
        'calculationCount', COUNT(*),
        'dateRange', jsonb_build_object(
            'start', MIN(created_at),
            'end', MAX(created_at)
        )
    ) INTO result
    FROM calculations
    WHERE project_id = project_uuid
    AND (start_date IS NULL OR created_at >= start_date)
    AND (end_date IS NULL OR created_at <= end_date);
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;
```

### Performance Optimizations

#### Partitioning Strategy
```sql
-- Partition calculations table by month for better performance
CREATE TABLE calculations_y2025m01 PARTITION OF calculations
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE calculations_y2025m02 PARTITION OF calculations
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

#### Connection Pooling
```typescript
// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // Maximum number of connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};
```

### Data Migration Strategy

#### Development to Production
```sql
-- Migration script for existing data
BEGIN;

-- Create new tables
CREATE TABLE IF NOT EXISTS projects_new (LIKE projects INCLUDING ALL);
CREATE TABLE IF NOT EXISTS calculations_new (LIKE calculations INCLUDING ALL);

-- Migrate data with transformations
INSERT INTO projects_new (id, name, description, calculation_preset_id, created_at, updated_at, user_id)
SELECT 
    gen_random_uuid(),
    'Migrated Project',
    'Project migrated from legacy system',
    'gpt-4',
    NOW(),
    NOW(),
    '00000000-0000-0000-0000-000000000000'
FROM generate_series(1, 10);

-- Update sequences and constraints
-- ... additional migration steps

COMMIT;
```

### Security Considerations

#### Row Level Security (RLS)
```sql
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY user_projects_policy ON projects
    FOR ALL TO authenticated_user
    USING (user_id = current_user_id());

-- Enable RLS on calculations
ALTER TABLE calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_calculations_policy ON calculations
    FOR ALL TO authenticated_user
    USING (project_id IN (
        SELECT id FROM projects WHERE user_id = current_user_id()
    ));
```

#### Data Encryption
```sql
-- Encrypt sensitive data
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt API tokens
UPDATE user_settings 
SET cursor_api_token = pgp_sym_encrypt(cursor_api_token, 'encryption_key')
WHERE cursor_api_token IS NOT NULL;
```

### Monitoring and Maintenance

#### Performance Monitoring Queries
```sql
-- Slow query identification
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Index usage analysis
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

#### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
pg_dump -h localhost -U postgres -d sustainable_ai_db \
  --format=custom --compress=9 \
  --file="backup_$(date +%Y%m%d_%H%M%S).dump"

# Restore from backup
pg_restore -h localhost -U postgres -d sustainable_ai_db backup_file.dump
```

## Business Value

### For Sustainability Managers
- Comprehensive tracking of AI-related carbon emissions
- Data-driven insights for environmental impact reduction
- Professional reporting capabilities for stakeholders
- Compliance support for sustainability initiatives

### For Development Teams
- Awareness of environmental impact of AI usage
- Optimization opportunities for model selection
- Historical tracking of development patterns
- Integration with existing development workflows

### For Organizations
- Corporate sustainability reporting
- Cost optimization through usage analysis
- Environmental responsibility tracking
- Competitive advantage through sustainability metrics
