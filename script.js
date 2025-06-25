document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const angleOptions = document.querySelector('.angle-options');
    const tipContainer = document.getElementById('tipContainer');
    const tipText = document.getElementById('tipText');
    const tipClose = document.getElementById('tipClose');
    const helperLinesToggle = document.getElementById('helperLinesToggle');
    const nextRoundBtn = document.getElementById('nextRoundBtn');
    const aimPoint = document.getElementById('aimPoint');
    const guideAngle = document.getElementById('guideAngle');

    let tableWidth, tableHeight;
    let cueBall, redBall, targetPocket;
    let correctAngle = 0;

    const pockets = [
        { x: 0, y: 0 }, { x: 0.5, y: 0 }, { x: 1, y: 0 },
        { x: 0, y: 1 }, { x: 0.5, y: 1 }, { x: 1, y: 1 }
    ];

    function resizeCanvas() {
        const billiardTable = document.querySelector('.billiard-table');
        const rect = billiardTable.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
        tableWidth = canvas.width;
        tableHeight = canvas.height;
        draw();
    }

    function showTip(message) {
        tipText.textContent = message;
        tipContainer.style.display = 'block';
    }

    function hideTip() {
        tipContainer.style.display = 'none';
    }

    tipClose.addEventListener('click', hideTip);

    function getRandom(min, max) {
        return Math.random() * (max - min) + min;
    }

    function placeBalls() {
        const ballRadius = tableWidth * 0.02;
        cueBall = { 
            x: tableWidth * getRandom(0.2, 0.8), 
            y: tableHeight * getRandom(0.6, 0.9),
            radius: ballRadius
        };
        redBall = { 
            x: tableWidth * getRandom(0.2, 0.8), 
            y: tableHeight * getRandom(0.1, 0.4),
            radius: ballRadius
        };
    }

    function chooseTargetPocket() {
        // Always use the top-middle pocket as target
        targetPocket = { 
            x: pockets[1].x * tableWidth, 
            y: pockets[1].y * tableHeight, 
            radius: tableWidth * 0.03 
        };
    }

    function calculateAngle() {
        const vecCR_x = redBall.x - cueBall.x;
        const vecCR_y = redBall.y - cueBall.y;
        const vecRP_x = targetPocket.x - redBall.x;
        const vecRP_y = targetPocket.y - redBall.y;

        const angleCR = Math.atan2(vecCR_y, vecCR_x);
        const angleRP = Math.atan2(vecRP_y, vecRP_x);

        let angleDiff = Math.abs(angleCR - angleRP);
        if (angleDiff > Math.PI) {
            angleDiff = 2 * Math.PI - angleDiff;
        }

        // 修改为精确到5度的倍数
        correctAngle = Math.round(angleDiff * (180 / Math.PI) / 5) * 5;
        console.log('Correct Angle:', correctAngle);
        updateAimGuide();
    }

    function updateAimGuide() {
        // Update angle display only when helper lines are enabled
        if (helperLinesToggle.checked) {
            guideAngle.textContent = `角度: ${correctAngle}°`;
            guideAngle.style.display = 'block';
        } else {
            guideAngle.style.display = 'none';
        }
        
        // Calculate aim point position - where the cue ball center should aim
        // For proper billiard physics, the aim point should be outside the object ball
        // when using cut angles, representing where to aim the cue ball center
        
        const ballRadius = 58; // Visual radius for positioning (120px ball - 2px border) / 2 = 58px
        const centerX = 60; // Center of the 120px ball (30 * 2)
        const centerY = 60;
        
        // Convert angle to radians for calculation
        const angleRad = (correctAngle * Math.PI) / 180;
        
        // For cut shots, the aim point should be outside the ball
        // 0° = aim at center, larger angles = aim further outside
        // The distance from ball center increases with angle
        
        const maxAngle = 70; // Maximum angle in our system
        const normalizedAngle = Math.min(correctAngle, maxAngle) / maxAngle;
        
        // Calculate how far outside the ball to aim
        // At 0°: aim at center (distance = 0)
        // At 30°: aim at ball edge (distance = ballRadius)
        // At 60°: aim outside the ball (distance = ballRadius * 2)
        // Linear interpolation based on angle
        const aimDistance = ballRadius * (correctAngle / 30);
        
        // Position the aim point to the right of ball center
        const aimX = centerX + aimDistance;
        const aimY = centerY;
        
        // Update aim point position
        aimPoint.style.left = `${aimX - 4}px`; // -4 to center the 8px point
        aimPoint.style.top = `${aimY - 4}px`;
        aimPoint.style.transform = 'none'; // Remove the center transform
    }

    function draw() {
        if (!ctx) return;
        // Clear canvas
        ctx.clearRect(0, 0, tableWidth, tableHeight);

        // Draw pockets
        ctx.fillStyle = 'black';
        const pocketRadius = tableWidth * 0.03;
        pockets.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x * tableWidth, p.y * tableHeight, pocketRadius, 0, Math.PI * 2);
            ctx.fill();
        });

        // Highlight target pocket
        if (targetPocket) {
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(targetPocket.x, targetPocket.y, targetPocket.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw balls
        if (cueBall) {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(cueBall.x, cueBall.y, cueBall.radius, 0, Math.PI * 2);
            ctx.fill();
        }
        if (redBall) {
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(redBall.x, redBall.y, redBall.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw helper lines
        if (helperLinesToggle.checked && cueBall && redBall && targetPocket) {
            // Line from cue to red ball (white)
            ctx.beginPath();
            ctx.moveTo(cueBall.x, cueBall.y);
            ctx.lineTo(redBall.x, redBall.y);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Calculate intersection point of pocket circle with vertical center line
            const pocketRadius = tableWidth * 0.03;
            const pocketEdgePoint = {
                x: targetPocket.x, // Already at center line for top-middle pocket
                y: targetPocket.y + pocketRadius // Bottom edge of the pocket circle
            };

            // Line from pocket edge to red ball (red)
            ctx.beginPath();
            ctx.moveTo(pocketEdgePoint.x, pocketEdgePoint.y);
            ctx.lineTo(redBall.x, redBall.y);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Line from pocket edge to red ball, extended beyond red ball (red)
            const dirRed = {x: redBall.x - pocketEdgePoint.x, y: redBall.y - pocketEdgePoint.y};
            const lenRed = Math.sqrt(dirRed.x**2 + dirRed.y**2);
            if (lenRed > 0) {
                const unitDirRed = {x: dirRed.x / lenRed, y: dirRed.y / lenRed};
                const endPointRed = {x: redBall.x + unitDirRed.x * (tableWidth + tableHeight), y: redBall.y + unitDirRed.y * (tableWidth + tableHeight)};
                ctx.beginPath();
                ctx.moveTo(redBall.x, redBall.y);
                ctx.lineTo(endPointRed.x, endPointRed.y);
                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Extended line from cue ball through red ball (white)
            const dirExtended = {x: redBall.x - cueBall.x, y: redBall.y - cueBall.y};
            const lenExtended = Math.sqrt(dirExtended.x**2 + dirExtended.y**2);
            if (lenExtended > 0) {
                const unitDirExtended = {x: dirExtended.x / lenExtended, y: dirExtended.y / lenExtended};
                const endPointExtended = {x: redBall.x + unitDirExtended.x * (tableWidth + tableHeight), y: redBall.y + unitDirExtended.y * (tableWidth + tableHeight)};
                ctx.beginPath();
                ctx.moveTo(redBall.x, redBall.y);
                ctx.lineTo(endPointExtended.x, endPointExtended.y);
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Draw angle A indicator at red ball position
            if (lenExtended > 0 && lenRed > 0) {
                // Vector from red ball to cue ball
                const vecRedToCue = { x: cueBall.x - redBall.x, y: cueBall.y - redBall.y };
                // Vector from red ball to pocket
                const vecRedToPocket = { x: pocketEdgePoint.x - redBall.x, y: pocketEdgePoint.y - redBall.y };

                const angle1 = Math.atan2(vecRedToCue.y, vecRedToCue.x); // Angle towards cue ball
                const angle2 = Math.atan2(vecRedToPocket.y, vecRedToPocket.x); // Angle towards pocket

                // The angle to draw is between the pocket line (angle2) and the extended cue ball line (angle1 + PI).
                const angle3 = angle1 + Math.PI;

                let diff = angle3 - angle2;
                // Normalize diff to be between -PI and PI
                while (diff <= -Math.PI) diff += 2 * Math.PI;
                while (diff > Math.PI) diff -= 2 * Math.PI;

                const correctAngle = Math.abs(diff * 180 / Math.PI).toFixed(0);
                const antiClockwise = diff > 0;
                // 角度扇形和数值标注逻辑已移除
            }
        }
    }

    function highlightCorrectAnswers() {
        const previouslyHighlighted = angleOptions.querySelector('.correct-answer');
        if (previouslyHighlighted) {
            previouslyHighlighted.classList.remove('correct-answer');
        }

        if (helperLinesToggle.checked) {
            const correctButton = angleOptions.querySelector(`button[data-angle="${correctAngle}"]`);
            if (correctButton) {
                correctButton.classList.add('correct-answer');
            }
        }
    }

    function startNewRound() {
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop
        do {
            placeBalls();
            chooseTargetPocket();
            calculateAngle();
            attempts++;
        } while (correctAngle > 70 && attempts < maxAttempts);

        draw();
        hideTip();
        highlightCorrectAnswers();
    }

    angleOptions.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') {
            const selectedAngle = parseInt(e.target.dataset.angle, 10);
            if (selectedAngle === correctAngle) {
                showTip('正确！');
            } else {
                showTip(`错误，正确角度是 ${correctAngle}°`);
            }
        }
    });

    helperLinesToggle.addEventListener('change', () => {
        draw();
        highlightCorrectAnswers();
        updateAimGuide();
    });

    nextRoundBtn.addEventListener('click', startNewRound);

    window.addEventListener('resize', resizeCanvas);

    // Initial setup
    resizeCanvas();
    startNewRound();
});
