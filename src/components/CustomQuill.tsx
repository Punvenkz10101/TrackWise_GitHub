import ReactQuill, { ReactQuillProps } from 'react-quill';
import { forwardRef, useImperativeHandle, useRef, useMemo, useEffect } from 'react';
import 'react-quill/dist/quill.snow.css';

// Define the type for our CustomQuill component
interface CustomQuillProps extends ReactQuillProps {
  value: string;
  onChange: (value: string) => void;
}

// Create a forwardRef wrapper for ReactQuill
const CustomQuill = forwardRef<ReactQuill, CustomQuillProps>((props, ref) => {
  const quillRef = useRef<ReactQuill>(null);

  // Forward the ref properly to the ReactQuill instance
  useImperativeHandle(ref, () => ({
    // Expose the underlying ReactQuill instance and its methods
    getEditor: () => quillRef.current?.getEditor(),
    focus: () => quillRef.current?.focus(),
    blur: () => quillRef.current?.blur(),
    // Access to the Quill instance
    getQuill: () => quillRef.current?.getEditor(),
    // You can add more methods here if needed
    ...quillRef.current
  }));

  // Memoize modules and formats
  const modules = useMemo(() => {
    return {
      ...props.modules,
      // You can add custom module options here if needed
    };
  }, [props.modules]);

  const formats = useMemo(() => props.formats, [props.formats]);

  // Suppress the findDOMNode deprecation warning in development
  useEffect(() => {
    // Only in development, suppress specific console warnings related to ReactQuill
    if (import.meta.env.DEV) {
      const originalError = console.error;
      const originalWarn = console.warn;

      console.error = (...args) => {
        // Filter out specific warnings
        if (typeof args[0] === 'string') {
          if (
            args[0].includes('Warning: findDOMNode is deprecated') ||
            args[0].includes('DOMNodeInserted') ||
            args[0].includes('ReactDOM.render is no longer supported')
          ) {
            return; // Don't log these warnings
          }
        }
        originalError(...args);
      };

      console.warn = (...args) => {
        // Filter out findDOMNode warnings
        if (typeof args[0] === 'string') {
          if (args[0].includes('Warning: findDOMNode is deprecated')) {
            return; // Don't log these warnings
          }
        }
        originalWarn(...args);
      };

      // Cleanup
      return () => {
        console.error = originalError;
        console.warn = originalWarn;
      };
    }
  }, []);

  // Wrap ReactQuill with our custom props
  return (
    <ReactQuill
      ref={quillRef}
      theme={props.theme || 'snow'}
      value={props.value}
      onChange={props.onChange}
      modules={modules}
      formats={formats}
      className={props.className}
      placeholder={props.placeholder}
      readOnly={props.readOnly}
      {...props}
    />
  );
});

// Add display name for better debugging
CustomQuill.displayName = 'CustomQuill';

export default CustomQuill; 