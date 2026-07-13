export interface GithubAsset {
  name: string;
  browser_download_url: string;
}

export interface GithubReleaseResponse {
  assets: GithubAsset[];
}