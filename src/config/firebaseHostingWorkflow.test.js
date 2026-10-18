const fs = require('fs');
const path = require('path');

const workflowPath = path.resolve(
  __dirname,
  '../../.github/workflows/firebase-hosting-main.yml',
);

describe('Firebase Hosting main workflow', () => {
  it('verifies production through the apex domain and retains the fallback', () => {
    const workflow = fs.readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain(
      'FIREBASE_HOSTING_ORIGIN: https://harpervance.com',
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
});
