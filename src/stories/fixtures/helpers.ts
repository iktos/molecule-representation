export async function copySvgToClipboard(svgElement: SVGSVGElement) {
  try {
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    const width = svgElement.getAttribute('width') || '300';
    const height = svgElement.getAttribute('height') || '150';

    const utf8Bytes = new TextEncoder().encode(svgString);
    const base64Svg = btoa(String.fromCharCode(...utf8Bytes));
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    const img = new Image();
    img.src = dataUrl;

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const scale = window.devicePixelRatio || 1;
      const canvasWidth = parseInt(width);
      const canvasHeight = parseInt(height);

      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context from canvas.');
        return;
      }
      ctx.scale(scale, scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]);
            console.log('SVG copied to clipboard as PNG image!');
            alert('Molecule image copied to clipboard!'); // Optional user feedback
          } catch (clipboardErr) {
            console.error('Failed to write to clipboard:', clipboardErr);
            alert('Failed to copy image to clipboard. Check browser permissions or console.');
          }
        } else if (!blob) {
          console.error('Failed to convert canvas to blob.');
          alert('Failed to create image blob for copying.');
        } else {
          console.error('Clipboard API (navigator.clipboard.write) not available or not permitted.');
          alert('Clipboard API not available. Could not copy image.');
        }
      }, 'image/png');
    };

    img.onerror = (e) => {
      console.log('Image load error event:', e);
      console.error('Failed to load SVG Data URL as an image. Check SVG validity, CSP, and Data URL length limits.');
      alert('Error loading SVG image for copying. See console for details.');
    };
  } catch (err) {
    console.error('Error copying SVG to clipboard:', err);
    alert('An error occurred while trying to copy the image. See console.');
  }
}

export async function downloadSvgAsPng(svgElement: SVGSVGElement, filename = 'molecule.png') {
  try {
    console.log('Attempting to download SVG as PNG:', svgElement);
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    let width = svgElement.getAttribute('width') || '300';
    let height = svgElement.getAttribute('height') || '150';
    const viewBox = svgElement.getAttribute('viewBox');
    if (viewBox) {
      const parts = viewBox.split(' ');
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }

    const utf8Bytes = new TextEncoder().encode(svgString);
    const base64Svg = btoa(String.fromCharCode(...utf8Bytes));
    const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

    const img = new Image();
    img.src = dataUrl;

    img.onload = async () => {
      const canvas = document.createElement('canvas');
      const scale = window.devicePixelRatio || 1;
      const canvasWidth = parseInt(width);
      const canvasHeight = parseInt(height);

      canvas.width = canvasWidth * scale;
      canvas.height = canvasHeight * scale;
      canvas.style.width = `${canvasWidth}px`;
      canvas.style.height = `${canvasHeight}px`;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        console.error('Failed to get 2D context from canvas.');
        alert('Could not prepare image for download.');
        return;
      }
      ctx.scale(scale, scale);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      canvas.toBlob((blob) => {
        if (blob) {
          const downloadUrl = URL.createObjectURL(blob);

          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = filename;

          document.body.appendChild(link);

          link.click();

          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);

          console.log('PNG download initiated for:', filename);
        } else {
          console.error('Failed to convert canvas to blob for download.');
          alert('Failed to create image blob for download.');
        }
      }, 'image/png');
    };

    img.onerror = (e) => {
      console.log('Image load error event:', e);
      console.error('Failed to load SVG Data URL as an image for download.');
      alert('Error loading SVG image for download. See console for details.');
    };
  } catch (err) {
    console.error('Error preparing SVG for download:', err);
    alert('An error occurred while preparing the download. See console.');
  }
}
