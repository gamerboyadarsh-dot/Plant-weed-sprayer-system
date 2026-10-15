import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_PARAMS } from '../utils/constants';
import { fetchImages, processPipeline } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';
import { useBackendStatus } from '../hooks/useBackendStatus';

const PipelineContext = createContext(null);

export function PipelineProvider({ children }) {
  const [params, setParams] = useState(DEFAULT_PARAMS);
  const [imagesList, setImagesList] = useState([]);
  const [selectedImage, setSelectedImage] = useState('weed_0001.png');
  const [uploadedBase64, setUploadedBase64] = useState(null);
  
  const [pipelineData, setPipelineData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [hoveredCandidateId, setHoveredCandidateId] = useState(null);

  const { online } = useBackendStatus();
  const retryTimeoutRef = useRef(null);

  // Debounced params for smooth slider adjustments
  const debouncedParams = useDebounce(params, 220);

  // Load image catalog with auto-retry
  const loadImageCatalog = useCallback(() => {
    fetchImages()
      .then(data => {
        if (data && data.images) {
          setImagesList(data.images);
        }
      })
      .catch(err => {
        console.error('Failed to load image catalog:', err);
      });
  }, []);

  useEffect(() => {
    loadImageCatalog();
  }, [loadImageCatalog]);

  // Re-fetch images if empty when backend comes online
  useEffect(() => {
    if (online && imagesList.length === 0) {
      loadImageCatalog();
    }
  }, [online, imagesList.length, loadImageCatalog]);

  // Run pipeline when debounced parameters or selected image changes
  const executePipeline = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const payload = {
      image_name: uploadedBase64 ? 'uploaded_custom.png' : selectedImage,
      image_base64: uploadedBase64,
      ...debouncedParams
    };

    try {
      const data = await processPipeline(payload);
      setPipelineData(data);
      setErrorMsg(null);
    } catch (err) {
      console.warn('Pipeline processing request failed (may be waking up):', err);
      setErrorMsg(err.message || 'Pipeline processing failed');
      
      // Auto-retry once after 3 seconds if cold-starting
      if (!pipelineData) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          executePipeline();
        }, 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [debouncedParams, selectedImage, uploadedBase64, pipelineData]);

  useEffect(() => {
    executePipeline();
    return () => clearTimeout(retryTimeoutRef.current);
  }, [executePipeline]);

  // Automatically execute pipeline as soon as backend comes online if data is still empty
  useEffect(() => {
    if (online && !pipelineData && !loading) {
      executePipeline();
    }
  }, [online, pipelineData, loading, executePipeline]);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(value) }));
  };

  const resetParams = () => {
    setParams(DEFAULT_PARAMS);
  };

  const selectImageByName = (name) => {
    setUploadedBase64(null);
    setSelectedImage(name);
  };

  const handleCustomUpload = (base64) => {
    setSelectedImage('Custom Upload');
    setUploadedBase64(base64);
  };

  const value = {
    params,
    updateParam,
    resetParams,
    imagesList,
    selectedImage,
    selectImageByName,
    uploadedBase64,
    handleCustomUpload,
    pipelineData,
    loading,
    errorMsg,
    hoveredCandidateId,
    setHoveredCandidateId,
    refreshPipeline: executePipeline
  };

  return (
    <PipelineContext.Provider value={value}>
      {children}
    </PipelineContext.Provider>
  );
}

export function usePipeline() {
  const context = useContext(PipelineContext);
  if (!context) {
    throw new Error('usePipeline must be used within a PipelineProvider');
  }
  return context;
}
