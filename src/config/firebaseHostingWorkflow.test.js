const fs = require('fs');
const path = require('path');

const workflowPath = path.resolve(
  __dirname,
  '../../.github/workflows/firebase-hosting-main.yml',
);
const packagePath = path.resolve(__dirname, '../../package.json');
const firebasePath = path.resolve(__dirname, '../../firebase.json');
const productionEnvironmentPath = path.resolve(
  __dirname,
  '../../.env.production',
);

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
      'FIREBASE_HOSTING_WWW_ORIGIN: https://www.harpervanceqa.com',
    );
    expect(workflow).toContain(
      'PLAYWRIGHT_BASE_URL: ${{ env.FIREBASE_HOSTING_ORIGIN }}',
    );
    expect(workflow).toContain(
      'PLAYWRIGHT_BASE_URL: ${{ env.FIREBASE_HOSTING_FALLBACK_ORIGIN }}',
    );
    expect(workflow).toContain('Verify Harper Vance production Hosting URL');
    expect(workflow).toContain('"$FIREBASE_HOSTING_WWW_ORIGIN"');
    expect(workflow).toContain('Verify Firebase fallback Hosting URL');
  });

  it('keeps the manual deploy command aligned with the configured Hosting site', () => {
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const firebaseJson = JSON.parse(fs.readFileSync(firebasePath, 'utf8'));

    expect(firebaseJson.hosting.site).toBe('harpervanceqa-dev');
    expect(packageJson.scripts.deploy).toContain(
      'firebase deploy --only hosting:harpervanceqa-dev',
    );

    ['/health', '/api/**', '/pages/**'].forEach((source) => {
      expect(firebaseJson.hosting.rewrites).toContainEqual({
        source,
        function: {
          functionId: 'sonaDashboard',
          region: 'us-central1',
        },
      });
    });

    const publicPageRewrite = firebaseJson.hosting.rewrites.find(
      (rewrite) => rewrite.source === '/pages/**',
    );
    expect(publicPageRewrite).toEqual({
      source: '/pages/**',
      function: {
        functionId: 'sonaDashboard',
        region: 'us-central1',
      },
    });
  });

  it('uses same-origin production routes and keeps analytics disabled by default', () => {
    const productionEnvironment = fs.readFileSync(
      productionEnvironmentPath,
      'utf8',
    );

    expect(productionEnvironment).toMatch(/^REACT_APP_API_BASE_URL=$/m);
    expect(productionEnvironment).toContain(
      'REACT_APP_PUBLIC_ACCESS_URL=/pages/client-access',
    );
    expect(productionEnvironment).toContain(
      'REACT_APP_REQUEST_ACCESS_URL=/pages/request-access',
    );
    expect(productionEnvironment).toContain(
      'REACT_APP_ANALYTICS_ENABLED=false',
    );
  });
});
