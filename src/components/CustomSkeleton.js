// components/CustomSkeleton.js
import React from 'react';
import { Skeleton } from '@mui/material';

const CustomSkeleton = ({ variant = "text", width = "100%", height = 20, sx = {}, ...rest }) => {
  return (
    <Skeleton
      variant={variant}
      width={width}
      height={height}
      animation={false}
      sx={{
        background: `linear-gradient(90deg, #eee 25%, #f5f5f5 50%, #eee 75%)`,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.4s infinite',
        '@keyframes shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        ...sx,
      }}
      {...rest}
    />
  );
};

export default CustomSkeleton;
