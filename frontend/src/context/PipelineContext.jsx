import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_PARAMS } from '../utils/constants';
import { fetchImages, processPipeline } from '../api/client';
import { useDebounce } from '../hooks/useDebounce';

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

  // Debounced params for smooth slider adjustments
  const debouncedParams = useDebounce(params, 220);

  // Load initial image catalog
  useEffect(() => {
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
    } catch (err) {
      setErrorMsg(err.message || 'Pipeline processing failed');
    } finally {
      setLoading(false);
    }
  }, [debouncedParams, selectedImage, uploadedBase64]);

  useEffect(() => {
    executePipeline();
  }, [executePipeline]);

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
