//routes-data.js
import express from 'express';
import multer from 'multer';
import { handleFileMetadataSave, getUserDatasets } from '../controllers/dataController.js';
import { visualizeData } from '../controllers/analysisController.js';
import Dataset from '../models/dataset.js';
import Analysis from '../models/analysis.js';
import User from '../models/user.js';



const router = express.Router();

// Middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
  if (!req.session.user || !req.session.user._id) {
    console.error('User not authenticated or missing session data');
    return res.status(401).redirect('/login');
  }
  next();
}

// Configure Multer for file uploads
const upload = multer({
  dest: 'uploads/', // Temporary storage for uploaded files
  limits: { fileSize: 10 * 1024 * 1024 }, // Limit file size to 10 MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== 'text/csv') {
      return cb(new Error('Only CSV files are allowed.'));
    }
    cb(null, true);
  },
});

// Render the CSV upload page
router.get('/upload-csv', ensureAuthenticated, (req, res) => {
  res.render('upload-csv');
});

// Route to render the visualization page
router.get('/visualize/:datasetId', ensureAuthenticated, async (req, res) => {
  await visualizeData(req, res);
});

//Create a new route to fetch saved analyses and render them on a new page.
router.get('/view-analysis', ensureAuthenticated, async (req, res) => {
  try {
    const savedAnalyses = await Analysis.find({ userId: req.session.user._id })
      .populate('datasetId')
      .sort({ createdAt: -1 })
      .lean(); // Use `lean` to simplify objects

    const analysesWithPreparedConfig = savedAnalyses.map((analysis) => ({
      ...analysis,
      visualizations: analysis.visualizations.map((visualization, index) => ({
        elementId: `chart-${analysis._id}-${index}`,
        config: visualization.config,
      })),
    }));

    res.render('view-analysis', { savedAnalyses: analysesWithPreparedConfig });
  } catch (error) {
    console.error('Error fetching saved analyses:', error);
    res.status(500).render('view-analysis', { errorMessage: 'Failed to load saved analyses.' });
  }
});
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = req.session.user || {
      username: 'Guest',
      name: 'No name provided',
      email: 'No email available',
      lastLogin: 'Unknown',
    };

    console.log('User data in profile route:', user); // Debugging log

    // Fetch uploaded datasets for the user
    const uploadedDatasets = await Dataset.find({ userId: user._id }).sort({ createdAt: -1 });

    // Fetch saved charts (analyses) for the user
    const savedCharts = await Analysis.find({ userId: user._id })
      .populate('datasetId')
      .sort({ createdAt: -1 });

    // Pass data to the profile view
    res.render('profile', {
      user,
      uploadedDatasets,
      savedCharts,
      activity: {
        datasetCount: uploadedDatasets.length,
        chartCount: savedCharts.length,
      },
    });
  } catch (error) {
    console.error('Error loading profile:', error);
    res.status(500).render('profile', { errorMessage: 'Failed to load profile. Please try again later.' });
  }
});



// Handle file upload and save extracted data
router.post('/upload', ensureAuthenticated, upload.single('csvFile'), async (req, res) => {
  await handleFileMetadataSave(req, res);
});

// Fetch and render recent datasets for the homepage
router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  await getUserDatasets(req, res);
});

router.get('/manual-entry', ensureAuthenticated, (req, res) => {
  res.render('manual-entry');
});

// Handle manual data entry submission
router.post('/manual-entry', ensureAuthenticated, async (req, res) => {
  try {
    const { datasetName, xAxisLabel, yAxisLabel, data } = req.body;

    console.log('Manual entry form data received:', req.body);

    // Validate input
    if (!datasetName || !xAxisLabel || !yAxisLabel || !data) {
      return res.status(400).render('manual-entry', {
        errorMessage: 'Please provide Dataset Name, X-Axis Label, Y-Axis Label, and data points.',
      });
    }

    // Transform the data into an array of objects
    const formattedData = data.map((point, index) => ({
      [xAxisLabel]: point.x || `Row ${index + 1}`,
      [yAxisLabel]: parseFloat(point.y) || 0, // Default to 0 if empty or invalid
    }));

    // Save the dataset with the custom dataset name
    const dataset = new Dataset({
      userId: req.session.user._id,
      fileName: datasetName.trim(), // Use the dataset name provided by the user
      data: formattedData,
    });

    console.log('Saving manual dataset:', dataset);

    await dataset.save();

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error saving manual dataset:', error);
    res.status(500).render('manual-entry', { errorMessage: 'Failed to save manual data. Please try again.' });
  }
});


//Route in data.js to handle saving the chart to the database.
router.post('/save-chart', ensureAuthenticated, async (req, res) => {
  try {
      const { chartConfig, chartType, datasetId } = req.body;

      console.log('Received POST data:', { chartConfig, chartType, datasetId }); // Debugging log

      if (!chartConfig || !chartType || !datasetId) {
          console.error('Missing required fields in the request body', { chartConfig, chartType, datasetId });
          return res.status(400).json({ success: false, message: 'Missing required fields.' });
      }

      const analysis = new Analysis({
          userId: req.session.user._id,
          datasetId,
          type: 'visualization',
          visualizations: [
              {
                  type: chartType,
                  config: chartConfig,
              },
          ],
      });

      await analysis.save();
      res.json({ success: true, message: 'Chart saved successfully!' });
  } catch (error) {
      console.error('Error saving chart:', error);
      res.status(500).json({ success: false, message: 'Failed to save chart.', error: error.message });
  }
});

// Route to update user name
router.post('/profile/update-name', ensureAuthenticated, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).render('profile', {
        errorMessage: 'Name cannot be empty.',
        user: req.session.user,
        uploadedDatasets: await Dataset.find({ userId: req.session.user._id }).sort({ createdAt: -1 }),
        savedCharts: await Analysis.find({ userId: req.session.user._id }).sort({ createdAt: -1 }),
      });
    }

    // Update the user's name in session and database
    req.session.user.name = name.trim();

    // Assuming you have a User model for updating the database
    await User.findByIdAndUpdate(req.session.user._id, { name: name.trim() });

    res.redirect('/profile');
  } catch (error) {
    console.error('Error updating name:', error);
    res.status(500).render('profile', {
      errorMessage: 'Failed to update name. Please try again later.',
      user: req.session.user,
    });
  }
});


// Route to search for a dataset by name and visualize it
router.post('/search-visualize', ensureAuthenticated, async (req, res) => {
  try {
    const { datasetName } = req.body;

    if (!datasetName || datasetName.trim() === '') {
      return res.status(400).render('homepage', {
        errorMessage: 'Please enter a valid dataset name to visualize.',
        recentDatasets: await Dataset.find({ userId: req.session.user._id }).sort({ createdAt: -1 }).limit(5), // Show existing datasets
      });
    }

    // Find the dataset by name for the authenticated user
    const dataset = await Dataset.findOne({
      userId: req.session.user._id,
      fileName: { $regex: new RegExp(datasetName.trim(), 'i') }, // Case-insensitive match
    });

    if (!dataset) {
      return res.status(404).render('homepage', {
        errorMessage: `No dataset found with the name "${datasetName}".`,
        recentDatasets: await Dataset.find({ userId: req.session.user._id }).sort({ createdAt: -1 }).limit(5),
      });
    }

    // Redirect to the visualization page for the found dataset
    res.redirect(`/visualize/${dataset._id}`);
  } catch (error) {
    console.error('Error searching for dataset:', error);
    res.status(500).render('homepage', {
      errorMessage: 'An error occurred while searching for the dataset. Please try again later.',
      recentDatasets: await Dataset.find({ userId: req.session.user._id }).sort({ createdAt: -1 }).limit(5),
    });
  }
});


export default router;