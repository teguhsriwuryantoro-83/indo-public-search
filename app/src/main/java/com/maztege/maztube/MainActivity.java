package com.maztege.maztube;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;

public class MainActivity extends Activity {
    private WebView web;
    private static final String APP_URL = "https://maztege-youtube-api.teguhsriwuryantoro.workers.dev/";

    private boolean openInYoutubeApp(String url) {
        Uri uri = Uri.parse(url);
        String host = uri.getHost() == null ? "" : uri.getHost().toLowerCase();
        boolean youtube = host.equals("youtube.com") ||
                host.equals("www.youtube.com") ||
                host.equals("m.youtube.com") ||
                host.equals("youtu.be") ||
                host.equals("music.youtube.com");
        if (!youtube) return false;

        Intent intent = new Intent(Intent.ACTION_VIEW, uri);
        intent.setPackage("com.google.android.youtube");
        try {
            startActivity(intent);
        } catch (Exception notAvailable) {
            try {
                Intent browserIntent = new Intent(Intent.ACTION_VIEW, uri);
                startActivity(browserIntent);
            } catch (Exception ignored) { }
        }
        return true;
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(android.graphics.Color.rgb(5, 18, 31));
        getWindow().setNavigationBarColor(android.graphics.Color.rgb(5, 18, 31));
        web = new WebView(this);
        web.setBackgroundColor(android.graphics.Color.rgb(7,17,31));
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(true);
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return openInYoutubeApp(request.getUrl().toString());
            }
            @SuppressWarnings("deprecation")
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return openInYoutubeApp(url);
            }
        });
        web.setWebChromeClient(new WebChromeClient());
        setContentView(web);
        if (state == null) web.loadUrl(APP_URL); else web.restoreState(state);
    }

    @Override protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
