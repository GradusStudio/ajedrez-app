import assert from 'node:assert/strict';
import { test } from 'node:test';
import { detectInstallPlatform } from './installPlatform';

const CHROME_ANDROID =
  'Mozilla/5.0 (Linux; Android 14; 23129RAA4G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
const SAFARI_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const CHROME_IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.37 Mobile/15E148 Safari/604.1';
const SAFARI_IPAD_AS_MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';
const SAFARI_MAC = SAFARI_IPAD_AS_MAC;
const CHROME_WINDOWS =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const FIREFOX_LINUX = 'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0';

test('Chrome en Android', () => assert.equal(detectInstallPlatform(CHROME_ANDROID, false, 5), 'android'));
test('Safari en iPhone', () => assert.equal(detectInstallPlatform(SAFARI_IPHONE, false, 5), 'ios'));
test('Chrome en iPhone (CriOS) también es iOS', () => assert.equal(detectInstallPlatform(CHROME_IPHONE, false, 5), 'ios'));
test('iPad que se presenta como Mac se detecta por los toques', () =>
  assert.equal(detectInstallPlatform(SAFARI_IPAD_AS_MAC, false, 5), 'ios'));
test('un Mac de verdad sin pantalla táctil es computadora', () =>
  assert.equal(detectInstallPlatform(SAFARI_MAC, false, 0), 'desktop'));
test('Chrome en Windows', () => assert.equal(detectInstallPlatform(CHROME_WINDOWS, false, 0), 'desktop'));
test('Windows con pantalla táctil sigue siendo computadora', () =>
  assert.equal(detectInstallPlatform(CHROME_WINDOWS, false, 10), 'desktop'));
test('Firefox en Linux', () => assert.equal(detectInstallPlatform(FIREFOX_LINUX, false, 0), 'desktop'));
test('instalada gana sobre el sistema', () => {
  assert.equal(detectInstallPlatform(CHROME_ANDROID, true, 5), 'installed');
  assert.equal(detectInstallPlatform(CHROME_WINDOWS, true, 0), 'installed');
});
test('iPhone en modo standalone', () => assert.equal(detectInstallPlatform(SAFARI_IPHONE, true, 5), 'installed'));
test('User-Agent vacío', () => assert.equal(detectInstallPlatform('', false, 0), 'desktop'));
