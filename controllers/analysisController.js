import Dataset from '../models/dataset.js';

export const visualizeData = async (req, res) => {
    try {
      const { datasetId } = req.params;
  
      // Fetch the dataset by ID
      const dataset = await Dataset.findById(datasetId);
      console.log('Fetched Dataset:', dataset); // Debugging log
      if (!dataset) {
        return res.status(404).render('analysis', { message: 'Dataset not found.' });
      }
  
      // Pass dataset and datasetId to the view
      res.render('analysis', {
        dataset: JSON.stringify(dataset.data),
        datasetId: dataset._id,
        fileName: dataset.fileName, // Include file name for display
      });
    } catch (error) {
      console.error('Error visualizing data:', error);
      res.status(500).render('analysis', { message: 'Failed to load dataset for visualization.' });
    }
  };
  