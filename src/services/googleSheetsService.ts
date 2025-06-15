import Papa from 'papaparse';
import { Restaurant, MenuItem } from '../types/restaurant';

const GOOGLE_SHEETS_BASE_URL = 'https://docs.google.com/spreadsheets/d/';

// Hardcoded Google Sheets URL for restaurant profiles
const PROFILE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR9TxJ461YJY5UIpP9Tfv8O1R8Lac6lyCGRRBPIHzBiscc9wSlk68Ja6_ffQUMMCWkeEr6ts_jDrrDI/pub?output=csv';

export const fetchRestaurantProfiles = async (): Promise<Restaurant[]> => {
  try {
    const response = await fetch(PROFILE_SHEET_URL);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            // Skip header row
            const restaurants = data.slice(1).map((row) => ({
              name: row[0] || '',
              address: row[1] || '',
              phoneNumber: row[2] || '',
              whatsappNumber: row[3] || '',
              hasDelivery: row[4]?.toLowerCase() === 'yes',
              deliveryPrice: parseFloat(row[5]) || 0,
              openingHours: row[6] || '',
              breakStartTime: row[7] || '',
              breakEndTime: row[8] || '',
              lunchStartTime: row[9] || '',
              lunchEndTime: row[10] || '',
              profilePictureUrl: row[11] || '',
              businessRegistrationUrl: row[12] || '',
              menuSheetUrl: row[13] || '',
            }));
            resolve(restaurants);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error('Error fetching restaurant profiles:', error);
    throw error;
  }
};

export const fetchMenuItems = async (menuSheetUrl: string): Promise<MenuItem[]> => {
  try {
    // Extract sheet ID from the URL and convert to CSV
    const sheetIdMatch = menuSheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!sheetIdMatch) {
      throw new Error('Invalid Google Sheets URL');
    }
    
    const sheetId = sheetIdMatch[1];
    const csvUrl = `${GOOGLE_SHEETS_BASE_URL}${sheetId}/export?format=csv&gid=0`;
    
    const response = await fetch(csvUrl);
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const data = results.data as string[][];
            // Skip header row
            const menuItems = data.slice(1).map((row) => {
              const priceAndSize = row[1] || '';
              const prices: { [size: string]: number } = {};
              
              // Parse price and size format: "SML[$200],MED[$300],LRG[$400]"
              if (priceAndSize) {
                const priceSegments = priceAndSize.split(',');
                priceSegments.forEach(segment => {
                  const match = segment.trim().match(/^(.+?)\[\$?(\d+(?:\.\d{2})?)\]$/);
                  if (match) {
                    const size = match[1].trim();
                    const price = parseFloat(match[2]);
                    prices[size] = price;
                  }
                });
              }
              
              return {
                name: row[0] || '',
                priceAndSize,
                period: (row[2]?.toLowerCase() === 'lunch' ? 'lunch' : 'break') as 'break' | 'lunch',
                type: (row[3]?.toLowerCase() || 'more') as 'meat' | 'side' | 'veg' | 'drink' | 'soup' | 'more',
                gravey: row[4] || '',
                prices,
              };
            });
            resolve(menuItems);
          } catch (error) {
            reject(error);
          }
        },
        error: (error) => reject(error),
      });
    });
  } catch (error) {
    console.error('Error fetching menu items:', error);
    throw error;
  }
};
