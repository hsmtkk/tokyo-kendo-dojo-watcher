/**
 * 東京都剣道道場連盟サイトを監視し、更新があればBandに通知する
 */
function monitorTodoren() {
  const TARGET_URL = 'https://www.todoren.com/index.html';
  const properties = PropertiesService.getScriptProperties();

  let lastModified = properties.getProperty('LAST_MODIFIED');
  let lastETag = properties.getProperty('LAST_ETAG');

  let response;
  try {
    // サイトのヘッダー情報を取得
    response = UrlFetchApp.fetch(TARGET_URL, {
      method: 'get',
      muteHttpExceptions: false
    });
  } catch (e) {
    console.error('サイトアクセス失敗: ' + e.toString());
    postToBand('東京都剣道道場連盟サイトへのアクセスに失敗しました');
    return;
  }

  const headers = response.getAllHeaders();
  const currentModified = headers['Last-Modified'] || null;
  const currentETag = headers['ETag'] || null;

  let message = '';

  if (!lastModified && !lastETag) {
    // 初回実行時
    message = '東京都剣道道場連盟サイトに更新なし';
  } else {
    // 更新判定
    const isModifiedChanged = currentModified && (currentModified !== lastModified);
    const isETagChanged = currentETag && (currentETag !== lastETag);

    if (isModifiedChanged || isETagChanged) {
      message = '東京都剣道道場連盟サイトに更新あり';
    } else {
      message = '東京都剣道道場連盟サイトに更新なし';
    }
  }

  // 通知
  postToBand(message);

  // 値を保存
  if (currentModified) properties.setProperty('LAST_MODIFIED', currentModified);
  if (currentETag) properties.setProperty('LAST_ETAG', currentETag);
}

/**
 * Band Open APIを使用してメッセージを投稿する
 * @param {string} content 投稿内容
 */
function postToBand(content) {
  const properties = PropertiesService.getScriptProperties();
  const accessToken = properties.getProperty('access_token');
  const bandKey = properties.getProperty('band_key');

  if (!accessToken || !bandKey) {
    console.error('クレデンシャル(access_token または band_key)が設定されていません。');
    return;
  }

  const url = 'https://openapi.band.us/v2/band/post/create';
  const payload = {
    access_token: accessToken,
    band_key: bandKey,
    content: content
  };

  const options = {
    method: 'post',
    payload: payload,
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const result = JSON.parse(response.getContentText());

    if (result.result_code !== 1) {
      console.error('Band API 投稿失敗: ' + response.getContentText());
    }
  } catch (e) {
    console.error('Band API リクエスト失敗: ' + e.toString());
  }
}
