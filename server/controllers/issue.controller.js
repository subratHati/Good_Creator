// controllers/issue.controller.js
const Issue = require('../models/Issue');

// ─── POST /api/issues ─────────────────────────────────────────────────────────
const submitIssue = async (req, res) => {
  const { category, message } = req.body;

  if (!category || !['collab_issue', 'bug', 'fraud_scam', 'payment_issue', 'other'].includes(category)) {
    return res.status(400).json({ message: 'Please select a valid category' });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ message: 'Please describe your issue' });
  }

  try {
    const issue = await Issue.create({
      userId: req.user.id,
      role: req.user.role,
      category,
      message: message.trim(),
    });
    res.json({ message: "Your issue has been submitted. We'll get back to you soon.", issue });
  } catch (error) {
    console.error('submitIssue error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── GET /api/issues (admin only) ────────────────────────────────────────────
const getAllIssues = async (req, res) => {
  try {
    const { status, category } = req.query;
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    const issues = await Issue.find(query)
      .populate('userId', 'email')
      .sort({ createdAt: -1 });

    res.json({ issues });
  } catch (error) {
    console.error('getAllIssues error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

// ─── PUT /api/issues/:id/status (admin only) ─────────────────────────────────
const updateIssueStatus = async (req, res) => {
  const { status } = req.body;
  if (!['open', 'in_review', 'resolved'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status' });
  }
  try {
    const issue = await Issue.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json({ message: 'Status updated', issue });
  } catch (error) {
    console.error('updateIssueStatus error:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitIssue,
  getAllIssues,
  updateIssueStatus,
};
