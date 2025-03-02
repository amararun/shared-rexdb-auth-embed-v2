export type SampleFile = {
  name: string;
  size: string;
  rowCount: number;
  columnCount: number;
  description: string;
  analysisPrompt?: string;
};

export async function getSampleFiles(): Promise<SampleFile[]> {
  try {
    // Fetch the list of files from the sample_files directory
    const response = await fetch('/sample_files/index.json');
    if (!response.ok) {
      throw new Error('Failed to fetch sample files list');
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading sample files:', error);
    // Fallback to static files if dynamic loading fails
    return [
      {
        name: "ICICI_BLUECHIP_SEP_DEC_2024.txt",
        size: "6.8 KB",
        rowCount: 82,
        columnCount: 8,
        description: "This data is monthly portfolio holdings disclosure of ICICI Prudential MF for September and December 2024, with market value and quantities of each instrument at the end of each month."
      },
      {
        name: "RBI_CARDS_ATM_POS_DEC2024.txt",
        size: "14 KB",
        rowCount: 66,
        columnCount: 28,
        description: "This is Reserve Bank of India's monthly statistics report on ATMs, credit cards, debit cards, and POS transactions. The dataset provided is for December 2024."
      }
    ];
  }
}

export async function getSampleFile(filename: string): Promise<File> {
  try {
    // Using the public directory path directly
    const response = await fetch(`/sample_files/${filename}`);
    if (!response.ok) {
      throw new Error('Failed to fetch sample file');
    }
    const blob = await response.blob();
    return new File([blob], filename, {
      type: 'text/plain'
    });
  } catch (error) {
    console.error('Error fetching sample file:', error);
    throw error;
  }
} 