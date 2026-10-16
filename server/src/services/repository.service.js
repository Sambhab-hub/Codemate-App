'use strict';

const axios = require('axios');
const Repository = require('../models/Repository.model');
const GitHubConnection = require('../models/GitHubConnection.model');
const AppError = require('../utils/AppError');

const getGitHubToken = async (userId) => {
  const connection = await GitHubConnection.findOne({ userId }).select('+accessToken');
  if (!connection || !connection.accessToken) {
    throw new AppError('GitHub account not connected. Please connect GitHub first.', 400);
  }
  return connection.accessToken;
};

const fetchRemoteGitHubRepos = async (userId) => {
  const token = await getGitHubToken(userId);

  try {
    const response = await axios.get('https://api.github.com/user/repos', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CodeMate-App',
      },
      params: {
        sort: 'updated',
        per_page: 100,
        affiliation: 'owner,collaborator,organization_member',
      },
    });

    return response.data.map((repo) => ({
      githubRepositoryId: repo.id,
      name: repo.name,
      owner: repo.owner.login,
      fullName: repo.full_name,
      description: repo.description || '',
      isPrivate: repo.private,
      url: repo.html_url,
      language: repo.language || 'Unknown',
      defaultBranch: repo.default_branch || 'main',
    }));
  } catch (err) {
    if (err.response?.status === 401) {
      throw new AppError('GitHub access token expired or revoked. Please reconnect GitHub.', 401);
    }
    throw new AppError(`Failed to fetch GitHub repositories: ${err.message}`, 500);
  }
};

const getTrackedRepos = async (userId) => {
  return Repository.find({ userId }).sort({ updatedAt: -1 });
};

const trackRepo = async (userId, repoData) => {
  const {
    githubRepositoryId,
    name,
    owner,
    fullName,
    description,
    isPrivate,
    url,
    language,
    defaultBranch,
  } = repoData;

  if (!githubRepositoryId || !name || !owner || !fullName) {
    throw new AppError('Missing required repository metadata (githubRepositoryId, name, owner, fullName)', 400);
  }

  const existing = await Repository.findOne({ userId, githubRepositoryId });
  if (existing) {
    throw new AppError('Repository is already tracked in CodeMate', 409);
  }

  const repo = await Repository.create({
    userId,
    githubRepositoryId,
    name,
    owner,
    fullName,
    description,
    isPrivate,
    url,
    language,
    defaultBranch,
  });

  return repo;
};

const getTrackedRepoById = async (userId, repoId) => {
  const repo = await Repository.findOne({ _id: repoId, userId });
  if (!repo) {
    throw new AppError('Repository not found', 404);
  }
  return repo;
};

const untrackRepo = async (userId, repoId) => {
  const repo = await Repository.findOneAndDelete({ _id: repoId, userId });
  if (!repo) {
    throw new AppError('Repository not found', 404);
  }
  return { id: repoId };
};

module.exports = {
  fetchRemoteGitHubRepos,
  getTrackedRepos,
  trackRepo,
  getTrackedRepoById,
  untrackRepo,
};
