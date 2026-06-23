const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true }, 
  name: { type: String, required: true, unique: true }, 
  title: { type: String, required: true },
  desc: { type: String }, 
  content: { type: [String], required: true }, 
  author: { type: String, required: true },
  status: { type: String, enum: ['active', 'archived'], default: 'active' }, 
  
  // Storage fields for embedded binary database payloads
  imageBuffer: { type: Buffer },
  imageMimeType: { type: String },
  imageFallbackUrl: { type: String }, // Used if the user opts to submit a web link instead of a file

  color: { type: String, default: 'bg-zinc-500' },
  date: { type: String, default: () => new Date().toISOString().split('T')[0] }
}, { timestamps: true });

articleSchema.pre('validate', function() {
  if (this.title && !this.name) {
    this.name = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s\-]/g, '') 
      .replace(/\s+/g, '-')          
      .replace(/-+/g, '-');          
  }
});

module.exports = mongoose.model('Article', articleSchema);