import { useRef, useState, useEffect } from "react";

export type SwipeOrientation = "horizontal" | "vertical";

export interface UseSwipeProps {
	onSwipeNext: () => void;
	onSwipePrev: () => void;
	orientation?: SwipeOrientation;
	threshold?: number;
	currentIndex: number; // Used to reset state on change
	canGoNext: boolean;
	canGoPrev: boolean;
}

export function useSwipe({
	onSwipeNext,
	onSwipePrev,
	orientation = "horizontal",
	threshold = 50,
	currentIndex,
	canGoNext,
	canGoPrev,
}: UseSwipeProps) {
	const [offset, setOffset] = useState(0);
	const [isDragging, setIsDragging] = useState(false);
	// We track if we are in the "snapping" phase after a drag
	const [isSnapping, setIsSnapping] = useState(false);

	const startPos = useRef<{ x: number; y: number } | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);
	// Track which direction we are snapping to
	const snapDirection = useRef<"next" | "prev" | "reset" | null>(null);

	// Reset state when index changes (navigation completed)
	useEffect(() => {
		setOffset(0);
		setIsDragging(false);
		setIsSnapping(false);
		snapDirection.current = null;
	}, [currentIndex]);

	const handlePointerDown = (e: React.PointerEvent) => {
		if (isSnapping) return; // Ignore interactions while snapping

		startPos.current = { x: e.clientX, y: e.clientY };
		setIsDragging(true);
		// Important for tracking drag: capture on the container
		e.currentTarget.setPointerCapture(e.pointerId);
	};

	const handlePointerMove = (e: React.PointerEvent) => {
		if (!isDragging || !startPos.current) return;

		// Prevent default scrolling behavior if possible (though touch-action handles this mostly)
		e.preventDefault();

		const currentX = e.clientX;
		const currentY = e.clientY;

		let delta = 0;
		if (orientation === "horizontal") {
			delta = currentX - startPos.current.x;
		} else {
			delta = currentY - startPos.current.y;
		}

		// Constrain drag based on availability
		// Dragging LEFT (negative delta) means going NEXT
		// Dragging RIGHT (positive delta) means going PREV
		if (!canGoNext && delta < 0) {
			delta = 0;
		}
		if (!canGoPrev && delta > 0) {
			delta = 0;
		}

		setOffset(delta);
	};

	const handlePointerUp = (e: React.PointerEvent) => {
		if (!isDragging) return;

		setIsDragging(false);
		e.currentTarget.releasePointerCapture(e.pointerId);
		startPos.current = null;

		const absOffset = Math.abs(offset);

		// If threshold met, snap to end
		// Check direction and capability again just to be safe
		const isNext = offset < 0;

		if (absOffset > threshold) {
			if (isNext && canGoNext) {
				const size =
					orientation === "horizontal"
						? containerRef.current?.offsetWidth || window.innerWidth
						: containerRef.current?.offsetHeight || window.innerHeight;

				const target = -size;
				setIsSnapping(true);
				setOffset(target);
				snapDirection.current = "next";
				return;
			}
			if (!isNext && canGoPrev) {
				const size =
					orientation === "horizontal"
						? containerRef.current?.offsetWidth || window.innerWidth
						: containerRef.current?.offsetHeight || window.innerHeight;

				const target = size;
				setIsSnapping(true);
				setOffset(target);
				snapDirection.current = "prev";
				return;
			}
		}

		// Fallback: Snap back to 0
		setIsSnapping(true);
		setOffset(0);
		snapDirection.current = "reset";
	};

	const handleTransitionEnd = () => {
		if (!isSnapping) return;

		if (snapDirection.current === "next") {
			onSwipeNext();
		} else if (snapDirection.current === "prev") {
			onSwipePrev();
		} else {
			// Reset
			setIsSnapping(false);
		}
	};

	return {
		offset,
		isDragging,
		isSnapping,
		containerRef,
		handlers: {
			onPointerDown: handlePointerDown,
			onPointerMove: handlePointerMove,
			onPointerUp: handlePointerUp,
			onPointerCancel: handlePointerUp,
			onTransitionEnd: handleTransitionEnd,
		},
		style: {
			touchAction: orientation === "horizontal" ? "pan-y" : "pan-x",
			userSelect: "none" as const,
		},
	};
}
