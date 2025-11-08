import React from 'react';
import ImageLibrary from '@/components/ImageLibrary';

const BackgroundSelector = ({ onBackgroundChange, images, setImages }) => {

  const handleSelectImage = (image) => {
    onBackgroundChange('image', image);
  };
  
  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-white text-sm font-medium mb-2">اختر صورة خلفية</h4>
        <ImageLibrary images={images} setImages={setImages} onSelect={handleSelectImage} title="اختر صورة خلفية" />
      </div>
    </div>
  );
};

export default BackgroundSelector;