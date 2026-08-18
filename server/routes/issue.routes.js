const express = require('express');
const router = express.Router();
const { submitIssue, getAllIssues, updateIssueStatus } = require('../controllers/issue.controller');
const { protect } = require('../middleware/auth.middleware');
const { isAdmin } = require('../middleware/role.middleware');

router.post('/', protect, submitIssue);
router.get('/', protect, isAdmin, getAllIssues);
router.put('/:id/status', protect, isAdmin, updateIssueStatus);

module.exports = router;
