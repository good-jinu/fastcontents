from playwright.sync_api import sync_playwright, expect
import time

def verify_swipe():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 400, 'height': 800}) # Mobile-like viewport
        page = context.new_page()

        url = "http://localhost:6006/iframe.html?args=&id=components-fastcontent--swipe-horizontal&viewMode=story"
        print(f"Navigating to {url}")
        try:
            page.goto(url)
        except Exception as e:
            print(f"Navigation failed: {e}")
            # Try once more
            time.sleep(2)
            page.goto(url)

        # Wait for content to load
        print("Waiting for content...")
        content_locator = page.get_by_text("Content 1")
        try:
            content_locator.wait_for(timeout=10000)
        except:
            print("Timeout waiting for content. Dumping page content.")
            print(page.content())
            page.screenshot(path="verification/failed_load.png")
            browser.close()
            return

        print("Content loaded. Taking initial screenshot.")
        page.screenshot(path="verification/1_initial.png")

        # Perform Swipe
        print("Performing swipe...")
        page.mouse.move(350, 400)
        page.mouse.down()
        page.mouse.move(200, 400, steps=10)
        page.mouse.move(50, 400, steps=10)
        page.mouse.up()
        print("Swipe released.")

        # Wait for transition
        time.sleep(2)

        # Verify next content
        print("Verifying next content (Content 2)...")
        next_content = page.get_by_text("Content 2")
        if next_content.is_visible():
            print("Next content visible!")
        else:
            print("Next content NOT visible.")

        page.screenshot(path="verification/2_after_swipe.png")

        browser.close()

if __name__ == "__main__":
    verify_swipe()
