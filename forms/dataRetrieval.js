import { db } from './firebaseConfig.js';
import { collection, query, where, getDocs, Timestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";
import { exportToExcel } from './excelExport.js';

async function retrieveData() {
  // Get form values
  const startDate = document.getElementById('startDate')?.value;
  const endDate = document.getElementById('endDate')?.value;
  const shift = document.getElementById('shiftCriteria')?.value;
  const sampleCondition = document.getElementById('sampleConditionCriteria')?.value;
  const ph = document.getElementById('phCriteria')?.value;
  const acidity = document.getElementById('acidityCriteria')?.value;
  const density = document.getElementById('densityCriteria')?.value;
  const temp = document.getElementById('tempCriteria')?.value;
  const spGr = document.getElementById('spGrCriteria')?.value;
  const fat = document.getElementById('fatCriteria')?.value;
  const snf = document.getElementById('snfCriteria')?.value;
  const ts = document.getElementById('tsCriteria')?.value;
  const protein = document.getElementById('proteinCriteria')?.value;
  const analyst = document.getElementById('analystCriteria')?.value;

  // Basic form validation
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Set the end date to the end of the day
    end.setHours(23, 59, 59, 999);

    if (start > end) {
      alert('Start date must be before end date.');
      return;
    }
  } else if (startDate || endDate) {
    alert('Please select both start and end dates, or leave both empty for no date filter.');
    return;
  }

  // Show loading spinner
  document.getElementById('loadingSpinner').style.display = 'block';

  // Build query with dynamic filtering
  let dataQuery = collection(db, "chemicallab");
  const queries = [];

  // Add date range filter
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set the end date to the end of the day
    end.setHours(23, 59, 59, 999);
    
    // Convert JavaScript Date to Firestore Timestamp
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);
    queries.push(where("timestamp", ">=", startTimestamp), where("timestamp", "<=", endTimestamp));
  }

  // Add other filters dynamically if values are provided
  if (shift) queries.push(where("shift", "==", shift));
  if (sampleCondition) queries.push(where("sampleCondition", "==", sampleCondition));
  if (ph) queries.push(where("ph", "==", parseFloat(ph)));
  if (acidity) queries.push(where("acidity", "==", parseFloat(acidity)));
  if (density) queries.push(where("density", "==", parseFloat(density)));
  if (temp) queries.push(where("temp", "==", parseFloat(temp)));
  if (spGr) queries.push(where("spGr", "==", parseFloat(spGr)));
  if (fat) queries.push(where("fat", "==", parseFloat(fat)));
  if (snf) queries.push(where("snf", "==", parseFloat(snf)));
  if (ts) queries.push(where("ts", "==", parseFloat(ts)));
  if (protein) queries.push(where("protein", "==", parseFloat(protein)));
  if (analyst) queries.push(where("analyst", "==", analyst));

  try {
    const finalQuery = queries.length ? query(dataQuery, ...queries) : dataQuery;
    const querySnapshot = await getDocs(finalQuery);
    let data = querySnapshot.docs.map(doc => {
      const docData = doc.data();
      
      // Improved timestamp handling
      let formattedTimestamp;
      if (docData.timestamp && docData.timestamp.toDate) {
        formattedTimestamp = docData.timestamp.toDate();
      } else {
        console.warn("Timestamp is missing or not in the expected format for document: ", doc.id);
        formattedTimestamp = new Date();  // Use current date as a fallback
      }

      return {
        ...docData,
        timestamp: formattedTimestamp  // Keep as a Date object
      };
    });

    // Log data for debugging
    console.log("Data Retrieved: ", data);

    if (data.length > 0) {
      exportToExcel(data);  // Export data to Excel
    } else {
      console.warn("No data matches the criteria.");
      alert("No data found for the selected criteria.");
    }
  } catch (error) {
    console.error("Error retrieving documents: ", error);
    alert("Error retrieving data. Please try again.");
  } finally {
    // Hide loading spinner
    document.getElementById('loadingSpinner').style.display = 'none';
  }
}

// Attach to window to make it globally accessible
window.retrieveData = retrieveData;
