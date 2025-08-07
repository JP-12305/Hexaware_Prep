const mongoose = require('mongoose');

const SuggestionSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
    failedTopic: { type: String, required: true },
    suggestedModuleTitle: { type: String, required: true },
    justification: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'dismissed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('suggestion', SuggestionSchema);