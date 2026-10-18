const fs = require('fs');
const path = require('path');

const workflowPath = path.resolve(
  __dirname,
  '../../.github/workflows/firebase-hosting-main.yml',
);
const packagePath = path.resolve(__dirname, '../../package.json');
const firebasePath = path.resolve(__dirname, '../../firebase.json');

describe('Firebase Hosting main workflow', () => {
  it('verifies production through the apex domain and retains the fallback', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain(
      'FIREBASE_HOSTING_ORIGIN: https://harpervanceqa.com',
    );
    expect(workflow).toContain(
      'FIREBASE_HOSTING_FALLBACK_ORIGIN: https://harpervanceqa-dev.web.app',
    );
    expect(workflow).toContain(
      'PLAYWRIGHT_BASE_URL: ${{ env.FIREBASE_HOSTING_ORIGIN }}',
    );
    expect(workflow).toContain(
      'PLAYWRIGHT_BASE_URL: ${{ env.FIREBASE_HOSTING_FALLBACK_ORIGIN }}',
    );
    expect(workflow).toContain('Verify Harper Vance production Hosting URL');
    expect(workflow).toContain('Verify Firebase fallback Hosting URL');
  });

  it('keeps the manual deploy command aligned with the configured Hosting site', () => {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const firebaseJson = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));

    expect(firebaseJson.hosting.site).toBe('harpervanceqa-dev');
    expect(packageJson.scripts.deploy).toContain(
      'firebase deploy --only hosting:harpervanceqa-dev',
    );
  });
});
