//dataController
import Dataset from '../models/dataset.js';
import fs from 'fs';
import csv from 'csv-parser';

// Save uploaded file and extract its data
export const handleFileMetadataSave = async (req, res) => {
  const { file } = req;
  if (!file) {
    return res.status(400).render('upload-csv', { errorMessage: 'No file uploaded.' });
  }

  const results = [];
  try {
    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    // Save extracted data to MongoDB
    const dataset = new Dataset({
      userId: req.session.user._id,
      fileName: file.originalname,
      data: results,
    });
    await dataset.save();

    res.render('upload-csv', { successMessage: 'File uploaded and data saved successfully!' });
  } catch (error) {
    console.error('Error processing CSV file:', error);
    res.status(500).render('upload-csv', { errorMessage: 'Failed to process the uploaded file.' });
  } finally {
    // Always delete the file, even if an error occurred
    fs.unlinkSync(file.path);
  }
};

// Handle Manual Data Entry
export const saveManualData = async (req, res) => {
  try {
    const { datasetName, xAxisLabel, yAxisLabel, data } = req.body;

    console.log('Form Data Received:', req.body);

    // Validate input
    if (!datasetName || !xAxisLabel || !yAxisLabel || !data) {
      return res.status(400).render('manual-entry', {
        errorMessage: 'Please provide Dataset Name, X-Axis Label, Y-Axis Label, and data points.',
      });
    }

    // Save the dataset with the custom name
    const dataset = new Dataset({
      userId: req.session.user._id,
      fileName: datasetName.trim(), // Use the datasetName from the form
      data: data.map((point) => ({
        [xAxisLabel]: point.x || '',
        [yAxisLabel]: parseFloat(point.y) || 0, // Ensure numerical values for Y-axis
      })),
    });

    console.log('Saving dataset:', dataset); // Log the dataset being saved

    await dataset.save();

    res.redirect('/dashboard'); // Redirect to dashboard after saving
  } catch (error) {
    console.error('Error saving manual data:', error);
    res.status(500).render('manual-entry', {
      errorMessage: 'Failed to save manual data. Please try again.',
    });
  }
};



// Fetch recent datasets for the homepage
// Fetch recent datasets for the homepage
export const getUserDatasets = async (req, res) => {
  try {
    // Check if the session has a user
    if (!req.session.user || !req.session.user._id) {
      console.error('User not authenticated or _id is missing');
      return res.status(401).render('homepage', { errorMessage: 'Unauthorized. Please log in.' });
    }

    // Fetch the user's datasets from the database
    const datasets = await Dataset.find({ userId: req.session.user._id })
      .sort({ createdAt: -1 }) // Sort by most recent
      .limit(5); // Fetch only the 5 most recent datasets

    if (!datasets || datasets.length === 0) {
      console.warn('No datasets found for the user.');
      return res.render('homepage', {
        errorMessage: 'You have not uploaded any datasets yet.',
        recentDatasets: [], // Ensure the page doesn't break
      });
    }

    console.log('Fetched datasets:', datasets); // Log fetched datasets

    // Render the homepage with the datasets
    res.render('homepage', { recentDatasets: datasets });
  } catch (error) {
    console.error('Error fetching datasets:', error);
    res.status(500).render('homepage', {
      errorMessage: 'An error occurred while loading your datasets. Please try again later.',
    });
  }
};


