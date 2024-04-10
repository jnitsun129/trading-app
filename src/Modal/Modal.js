import React, { useState, useRef } from "react";
import "./Modal.css";

const Modal = ({ title, image, form, onClose }) => {
    const modalRef = useRef(null);
    const dragHandleRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [modalSize, setModalSize] = useState({ width: 800, height: 600 });

    const handleMouseDownDrag = (e) => {
        setIsDragging(true);
        modalRef.current.initialX = e.clientX - position.x;
        modalRef.current.initialY = e.clientY - position.y;
    };

    const handleDragging = (e) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - modalRef.current.initialX,
                y: e.clientY - modalRef.current.initialY,
            });
        }
    };

    const handleDragEnd = () => {
        setIsDragging(false);
    };

    const handleMouseDownResize = (e) => {
        e.stopPropagation(); // Prevent triggering drag when resizing
        window.addEventListener("mousemove", handleMouseMoveResize);
        window.addEventListener("mouseup", handleMouseUpResize);
    };

    const handleMouseMoveResize = (e) => {
        const dimensions = modalRef.current.getBoundingClientRect();
        setModalSize({
            width: Math.max(e.clientX - dimensions.left, 200), // Minimum width: 200px
            height: Math.max(e.clientY - dimensions.top, 150), // Minimum height: 150px
        });
    };

    const handleMouseUpResize = () => {
        window.removeEventListener("mousemove", handleMouseMoveResize);
        window.removeEventListener("mouseup", handleMouseUpResize);
    };

    return (
        <div
            className="modal-overlay"
            onMouseDown={(e) => e.stopPropagation()}
            onMouseMove={handleDragging}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}>
            <div
                className="modal-container"
                ref={modalRef}
                style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    width: `${modalSize.width}px`,
                    height: `${modalSize.height}px`,
                }}>
                <div className="modal-header" onMouseDown={handleMouseDownDrag}>
                    <span className="modal-title">{title}</span>
                    <button onClick={onClose} className="close-btn">
                        &times;
                    </button>
                </div>
                <div className="modal-body">
                    {image()}
                    {form}
                </div>
                <div
                    className="resize-handle"
                    onMouseDown={handleMouseDownResize}
                    ref={dragHandleRef}></div>
            </div>
        </div>
    );
};

export default Modal;
