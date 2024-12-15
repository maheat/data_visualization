// import mongoose from 'mongoose';

// const datasetSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   fileName: { type: String, required: true },
//   filePath: { type: String, required: true }, // Local file path
//   createdAt: { type: Date, default: Date.now },
// });

// const Dataset = mongoose.model('Dataset', datasetSchema);
// export default Dataset;

import mongoose from 'mongoose';

const datasetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  data: { type: [mongoose.Schema.Types.Mixed], required: true }, // Array of objects (CSV rows)
  createdAt: { type: Date, default: Date.now },
});

const Dataset = mongoose.model('Dataset', datasetSchema);
export default Dataset;
