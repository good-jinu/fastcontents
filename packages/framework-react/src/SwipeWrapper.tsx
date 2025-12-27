import type { ReactNode } from "react";
import type { SwipeOrientation } from "./useSwipe";

export interface SwipeWrapperProps {
	children: ReactNode;
	offset: number;
	isDragging: boolean;
	isSnapping: boolean;
	orientation: SwipeOrientation;
}

export function DefaultSwipeWrapper({
	children,
	offset,
	isDragging,
	isSnapping,
	orientation,
}: SwipeWrapperProps) {
	const isHorizontal = orientation === "horizontal";
	const translate = isHorizontal
		? `translate3d(${offset}px, 0, 0)`
		: `translate3d(0, ${offset}px, 0)`;

	const transition = isSnapping
		? "transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)"
		: "none";

	return (
		<div
			style={{
				position: "absolute",
				top: 0,
				left: 0,
				width: "100%",
				height: "100%",
				transform: translate,
				transition,
				// Removed display: flex as children are absolute
			}}
		>
			{children}
		</div>
	);
}

// Helper to position items
export function SwipeItem({
	children,
	position,
	orientation,
}: {
	children: ReactNode;
	position: "prev" | "current" | "next";
	orientation: SwipeOrientation;
}) {
	const isHorizontal = orientation === "horizontal";
	const style: React.CSSProperties = {
		position: "absolute",
		width: "100%",
		height: "100%",
		top: 0,
		left: 0,
	};

	if (isHorizontal) {
		if (position === "prev") style.transform = "translateX(-100%)";
		if (position === "next") style.transform = "translateX(100%)";
	} else {
		if (position === "prev") style.transform = "translateY(-100%)";
		if (position === "next") style.transform = "translateY(100%)";
	}

	return <div style={style}>{children}</div>;
}
