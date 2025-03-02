# REX-A Analyzer User Guide

REX-A Analyzer is a powerful tool that allows you to analyze data across multiple sources simultaneously.  

### Original Release Information
Check out our original release post on LinkedIn for useful information and links:  
[https://link.tigzig.com/rex3](https://link.tigzig.com/rex3)      

---

## Quick Start 1: Using the Sample Button

The fastest way to get started with REX-A Analyzer is through the Sample button feature:

1. **Access Sample Files**: 
   - Click the "Sample" button in the top-right corner
   - Browse through curated sample datasets with detailed information about size, row count, and columns

2. **Select and Analyze**:
   - Choose any sample file that interests you
   - Each sample comes with:
     - File description
     - Size and structure information
     - Pre-crafted analysis prompts

3. **Database Options**:
   - After selecting a file, choose between:
     - **Temporary Database**: Instant analysis environment (Recommended for quick start)
     - **Your Own Database**: Connect to your existing database

4. **Quick Analysis**:
   - Copy the provided analysis prompt (Click "Copy Prompt" button)
   - Navigate to the AI Advanced Analyst tab
   - Paste and customize the prompt for detailed analysis

💡 **Pro Tip**: The sample files are carefully curated to demonstrate different analysis capabilities, from simple statistical analysis to complex data transformations.

## Quick Start 2: Sample Files on Google Drive

Sample files are available on Google Drive for quick testing, including:
- RBI Cards / ATM / POS live data (small but rich datasets)
- Mock customer profile datasets (100K to 10M rows)
- Various file sizes from 10MB to 1.2GB

[Access Sample Files](https://drive.google.com/drive/folders/1QlE8tJDKAX9XaHUCabfflPgRnNiOXigV)

## Interface Guide

### Buttons Overview
- **BYOW - Connect**: Connect to your own warehouse using credentials
- **BYOW - Create DB**: Create Temporary Postgres Database (requires login)
- **Choose File**: Upload CSV / TXT files
- **Quick → Table**: Load uploaded files into interactive tables
- **Quick → Structure**: AI analysis of uploaded file structure using sample rows
- **Quick → Analysis**: AI analysis of uploaded file using 100 rows of data
- **Model**: Select the AI model and agent for Advanced Analyst
- **Push-My DB**: Upload files to your connected warehouse (temporary database available without login)
- **Export**: Export files from connected warehouse
- **Sample**: Quick start with sample files

### Tabs Overview
- **AI Data Structure**: AI interpretation of file structure with PDF report
- **AI Quick Insights**: Quick analysis of uploaded file using 100 rows of data with PDF report
- **AI General Analysis**: Database-connected agent for natural language to SQL conversion and Python-based analysis
- **AI Advanced Analyst**: Sequential agent with multi-step analysis - reasoning, execution, and error handling
- **Logs**: Processing logs

## Detailed Features

### 1. BYOW (Bring Your Own Warehouse)
- Connect to MySQL and PostgreSQL warehouses
- Analyze existing warehouse data
- Simple credential-based connection
- Unlimited table sizes and query processing
- Operations executed on warehouse side
- Supports petabyte-scale data across thousands of tables

### 2. Natural Language-to-SQL Querying

#### Video Guide

1. [Basic Natural Language-to-SQL Guide with Statistical Analysis](https://www.youtube.com/watch?v=HX9dS1PZjfo)  
   Updated guide featuring advanced analyst with reasoning capabilities and model choice of o3-mini/deepseek-r1/gemni-flash-2.

2. [Comprehensive Guide: Advanced Analysis with Sequential Reasoning](https://www.youtube.com/watch?v=hqn3zrdXVSQ)

**Video Timeline:**
- 00:00:00 - Capabilities Overview
- 00:02:08 - DB Connection & Analysis
- 00:06:43 - File Upload & Analysis
- 00:09:21 - Sequential Agent Framework
- 00:15:02 - Performance Considerations
- 00:23:09 - Cost Considerations
- 00:29:49 - Live Error Debugging
- 00:37:37 - Architecture & API Flows
- 00:45:08 - Deployment Guide
- 00:58:19 - App Functionalities
- 01:01:05 - Resources
- 01:01:51 - Conclusion

#### Example Queries
- "Pull up record for Customer ID 12345"
- "Show response rate distribution by Education and Housing"
- "Display response rate by 10-year age buckets"
- "Analyze customer demographics with specific filters"

### 3. Interactive Tables
- Sort, filter, and search functionality
- Row details popup via calculator icon
- Column statistics with distribution metrics
- Comprehensive statistical analysis tools

### 4. File Analysis Features
- Support for TXT/CSV files (pipe or comma-delimited)
- Structure analysis with AI
- Detailed data analysis options
- File size capabilities:
  - Tested up to 600MB (5M rows)
  - App limit: 1.5GB (customizable)
  - Performance varies by file size
  - Interactive features work best with files under 10MB

### 5. Warehouse Integration
- Push data to your warehouse
- AI-powered data analysis
- Automatic schema detection
- Interactive query capabilities

### 6. Advanced Analytics
- Python-based statistical analysis
- Custom data transformations
- Chart generation
- Support for both warehouse and uploaded data

---

For technical setup and installation instructions, please refer to our [README.md](./README.md). 