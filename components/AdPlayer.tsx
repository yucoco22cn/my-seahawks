
import React, { useState, useEffect, useRef } from 'react';

interface AdPlayerProps {
  onComplete: () => void;
  onClose: () => void;
}

// Global variable for Google IMA SDK
declare const google: any;

const AdPlayer: React.FC<AdPlayerProps> = ({ onComplete, onClose }) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const adsLoaderRef = useRef<any>(null);
  const adsManagerRef = useRef<any>(null);
  const [adStatus, setAdStatus] = useState<string>('Initializing Ad...');
  const [error, setError] = useState<boolean>(false);

  // Sample IMA Ad Tag (Replace with your real tag from AdSense/AdManager)
  const AD_TAG_URL = "https://pubads.g.doubleclick.net/gampad/ads?iu=/21775744923/external/single_ad_samples&sz=640x480&cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&output=vast&unviewed_position_start=1&env=vp&impl=s&correlator=";

  useEffect(() => {
    // Check if IMA SDK is loaded
    if (typeof google === 'undefined' || !google.ima) {
      console.warn("IMA SDK not found. Ad-blocker might be active.");
      setError(true);
      setAdStatus("Ads blocked. Closing...");
      const timeout = setTimeout(onClose, 2000);
      return () => clearTimeout(timeout);
    }

    const initIMA = () => {
      // Create the ad display container
      const adDisplayContainer = new google.ima.AdDisplayContainer(
        adContainerRef.current,
        videoElementRef.current
      );

      // Must initialize container on user action if not already done
      adDisplayContainer.initialize();

      // Create ads loader
      adsLoaderRef.current = new google.ima.AdsLoader(adDisplayContainer);

      // Listen for ads manager loading
      adsLoaderRef.current.addEventListener(
        google.ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED,
        onAdsManagerLoaded,
        false
      );

      // Listen for errors
      adsLoaderRef.current.addEventListener(
        google.ima.AdErrorEvent.Type.AD_ERROR,
        onAdError,
        false
      );

      // Request ads
      const adsRequest = new google.ima.AdsRequest();
      adsRequest.adTagUrl = AD_TAG_URL;
      adsRequest.linearAdSlotWidth = window.innerWidth;
      adsRequest.linearAdSlotHeight = window.innerHeight;
      adsRequest.nonLinearAdSlotWidth = window.innerWidth;
      adsRequest.nonLinearAdSlotHeight = window.innerHeight;

      adsLoaderRef.current.requestAds(adsRequest);
    };

    const onAdsManagerLoaded = (adsManagerLoadedEvent: any) => {
      const adsRenderingSettings = new google.ima.AdsRenderingSettings();
      adsRenderingSettings.restoreCustomPlaybackStateOnAdBreakComplete = true;

      // Get the ads manager
      adsManagerRef.current = adsManagerLoadedEvent.getAdsManager(
        videoElementRef.current,
        adsRenderingSettings
      );

      // Add listeners for events
      adsManagerRef.current.addEventListener(google.ima.AdErrorEvent.Type.AD_ERROR, onAdError);
      adsManagerRef.current.addEventListener(google.ima.AdEvent.Type.CONTENT_RESUME_REQUESTED, onAdComplete);
      adsManagerRef.current.addEventListener(google.ima.AdEvent.Type.ALL_ADS_COMPLETED, onAdComplete);

      try {
        adsManagerRef.current.init(window.innerWidth, window.innerHeight, google.ima.ViewMode.NORMAL);
        adsManagerRef.current.start();
        setAdStatus("Ad Playing");
      } catch (adError) {
        console.error("AdsManager could not be initialized");
        onClose();
      }
    };

    const onAdError = (adErrorEvent: any) => {
      console.error("Ad Error:", adErrorEvent.getError());
      if (adsManagerRef.current) adsManagerRef.current.destroy();
      onClose();
    };

    const onAdComplete = () => {
      onComplete();
      onClose();
    };

    initIMA();

    return () => {
      if (adsManagerRef.current) {
        adsManagerRef.current.destroy();
      }
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-black z-[200] flex flex-col items-center justify-center overflow-hidden">
      {/* Container for the video element required by IMA */}
      <video ref={videoElementRef} className="hidden" />
      
      {/* Container where IMA will inject the ad UI */}
      <div ref={adContainerRef} className="w-full h-full" />

      {/* Loading Overlay */}
      {adStatus.includes("Initializing") && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4">
          <div className="w-12 h-12 border-4 border-seahawks-green border-t-transparent rounded-full animate-spin"></div>
          <div className="text-white/40 font-black uppercase text-xs tracking-widest">{adStatus}</div>
        </div>
      )}

      {/* Manual Close Safety */}
      <div className="absolute top-6 right-6 z-[210]">
        <button 
          onClick={onClose}
          className="bg-black/40 hover:bg-black/60 text-white/40 hover:text-white px-4 py-2 rounded-full font-black text-[10px] transition backdrop-blur-md border border-white/5"
        >
          {error ? "CLOSE" : "EXIT AD"}
        </button>
      </div>

      <div className="absolute bottom-6 left-6 z-[210] flex items-center gap-3 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md border border-white/5">
        <div className="w-8 h-8 bg-seahawks-green rounded-lg flex items-center justify-center font-black text-black text-[10px]">AD</div>
        <div>
          <div className="text-white font-bold text-[10px]">Rewarded Commercial</div>
          <div className="text-white/40 text-[8px] uppercase font-black">Powered by Google IMA</div>
        </div>
      </div>
    </div>
  );
};

export default AdPlayer;
