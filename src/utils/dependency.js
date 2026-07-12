const path = require('path');
const fs = require('fs-extra');
const { logger } = require('./logger');

const parseDependency = (dependencyString) => {
  let scheme = 'regular';
  let remaining = dependencyString;

  if (remaining.includes('://')) {
    [scheme, remaining] = remaining.split('://');
  }

  let [repoPath, version] = remaining.split(':');
  const [user, repo] = repoPath.split('/');

  return {
    scheme: scheme.toLowerCase(),
    user,
    repo,
    repoPath,
    version: version || 'latest'
  };
};

module.exports = {
  parseDependency
};