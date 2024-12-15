import mongoose from 'mongoose';

const analysisSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  datasetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Dataset', required: true },
  type: { type: String, enum: ['summary', 'visualization'], required: true }, // Type of analysis
  filters: { type: [String], default: [] },
  visualizations: [
    {
      type: { type: String, enum: ['bar', 'line', 'pie', 'doughnut'], required: true }, // Adjusted enum
      data: { type: mongoose.Schema.Types.Mixed }, // Stores data used in the visualization
      config: { type: mongoose.Schema.Types.Mixed }, // Full Chart.js configuration
    },
  ],
  createdAt: { type: Date, default: Date.now },
});


const Analysis = mongoose.model('Analysis', analysisSchema);

export default Analysis;
