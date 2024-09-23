const fs = require('fs');
const path = require('path');
const axios = require('axios');
const colors = require('colors');
const readline = require('readline');

class Moonbix {
    constructor() {
        this.authUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/third-party/access/accessToken';
        this.userInfoUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/user/user-info';
        this.startGameUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/start';
        this.gameDataUrl = 'https://app.winsnip.xyz/play';
        this.completeGameUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/game/complete';
        this.taskListUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/list';
        this.completeTaskUrl = 'https://www.binance.com/bapi/growth/v1/friendly/growth-paas/mini-app-activity/third-party/task/complete';

        this.game_response = null;
        this.game = null;

        this.headers = {
            "Accept": "*/*",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "vi-VN,vi;q=0.9,fr-FR;q=0.8,fr;q=0.7,en-US;q=0.6,en;q=0.5",
            "Content-Type": "application/json",
            "Origin": "https://www.binance.com",
            "Referer": "https://www.binance.com/vi/game/tg/moon-bix",
            "Sec-Ch-Ua": '"Not/A)Brand";v="99", "Google Chrome";v="115", "Chromium";v="115"',
            "Sec-Ch-Ua-Mobile": "?0",
            "Sec-Ch-Ua-Platform": '"Windows"',
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        };

        this.axios = axios.create({ headers: this.headers });
    }

    log(msg, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        switch(type) {
            case 'success':
                console.log(`[${timestamp}] [*] ${msg}`.green);
                break;
            case 'custom':
                console.log(`[${timestamp}] [*] ${msg}`.magenta);
                break;        
            case 'error':
                console.log(`[${timestamp}] [!] ${msg}`.red);
                break;
            case 'warning':
                console.log(`[${timestamp}] [*] ${msg}`.yellow);
                break;
            default:
                console.log(`[${timestamp}] [*] ${msg}`);
        }
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i > 0; i--) {
            const timestamp = new Date().toLocaleTimeString();
            readline.cursorTo(process.stdout, 0);
            process.stdout.write(`[${timestamp}] [*] Chờ ${i} giây để tiếp tục...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        readline.cursorTo(process.stdout, 0);
        readline.clearLine(process.stdout, 0);
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async authenticate(init_data) {
        try {
            let param = JSON.stringify({
                queryString: init_data,
                socialType: "telegram"
            });

            const accessTokenResponse = await this.axios.post(this.authUrl, param);

            if (accessTokenResponse.data.code !== "000000" || !accessTokenResponse.data.success) {
                throw new Error(`Failed to get access token: ${accessTokenResponse.data.message}`);
            }

            const accessToken = accessTokenResponse.data.data.accessToken;
            const userInfoHeaders = {
                ...this.headers,
                "X-Growth-Token": accessToken
            };

            const userInfoResponse = await this.axios.post(this.userInfoUrl, {
                resourceId: 2056
            }, { headers: userInfoHeaders });

            if (userInfoResponse.data.code !== "000000" || !userInfoResponse.data.success) {
                throw new Error(`Failed to get user info: ${userInfoResponse.data.message}`);
            }

            return { userInfo: userInfoResponse.data.data, accessToken };
        } catch (err) {
            this.log(`API call failed: ${err.message}`, 'error');
            return null;
        }
    }

    async startGame(accessToken) {
        try {
            const response = await this.axios.post(
                this.startGameUrl,
                { resourceId: 2056 },
                { headers: { ...this.headers, "X-Growth-Token": accessToken } }
            );

            this.game_response = response.data;
            if (response.data.code === '000000') {
                this.log("Bắt đầu game thành công", 'success');
                return true;
            }

            if (response.data.code === '116002') {
                this.log("Không đủ lượt chơi!", 'warning');
            } else {
                this.log("Lỗi khi bắt đầu game!", 'error');
            }

            return false;
        } catch (err) {
            this.log(`Không thể bắt đầu game: ${error.message}`, 'error');
            return false;
        }
    }

    async gameData() {
        try {
            const response = await axios.post(this.gameDataUrl, this.game_response);

            if (response.data.message === 'success') {
                this.game = response.data.game;
                this.log("Nhận dữ liệu game thành công", 'success');
                return true;
            }

            this.log(response.data.message, 'warning');
            return false;
        } catch (error) {
            this.log(`Lỗi khi nhận dữ liệu game: ${error.message}`, 'error');
            return false;
        }
    }

    async completeGame(accessToken) {
        try {

            const response = await this.axios.post(
                this.completeGameUrl,
                {
                    resourceId: 2056,
                    payload: this.game.payload,
                    log: this.game.log
                },
                { headers: { ...this.headers, "X-Growth-Token": accessToken } }
            );

            if (response.data.code === '000000' && response.data.success) {
                this.log(`Hoàn thành game thành công | Nhận được ${this.game.log} points`, 'custom');
                return true;
            }

            this.log(`Không thể hoàn thành game: ${response.data.message}`, 'error');
            return false;
        } catch (error) {
            this.log(`Lỗi khi hoàn thành game: ${error.message}`, 'error');
            return false;
        }
    }

    async playGameIfTicketsAvailable(authResult) {
        const { userInfo, accessToken } = authResult;
        const totalGrade = userInfo.metaInfo.totalGrade;
        let availableTickets = userInfo.metaInfo.totalAttempts;

        this.log(`Tổng điểm: ${totalGrade}`);
        this.log(`Vé đang có: ${availableTickets}`);

        while (availableTickets > 0) {
            this.log(`Bắt đầu game với ${availableTickets} vé có sẵn`, 'info');

            if (await this.startGame(accessToken)) {
                if (await this.gameData()) {
                    await this.waitWithCountdown(50);

                    if (await this.completeGame(accessToken)) {
                        availableTickets--;
                        this.log(`Vé còn lại: ${availableTickets}`, 'info');

                        await new Promise(resolve => setTimeout(resolve, 3000));
                    } else {
                        break;
                    }
                } else {
                    this.log("Không thể nhận dữ liệu game", 'error');
                    break;
                }
            } else {
                this.log("Không thể bắt đầu trò chơi", 'error');
                break;
            }
        }

        if (availableTickets === 0) {
            this.log("Đã sử dụng hết vé", 'success');
        }
    }

    async completeTasks(authResult) {
        const { userInfo, accessToken } = authResult;

        const resourceIds = await this.getTaskList(accessToken);

        if (!resourceIds || resourceIds.length === 0) {
            this.log("No uncompleted tasks found", 'info');
            return;
        }

        for (const resourceId of resourceIds) {
            if (resourceId !== 2058) {
                const success = await this.completeTask(accessToken, resourceId);
                if (success) {
                    this.log(`Đã hoàn thành nhiệm vụ: ${resourceId}`, 'success');
                } else {
                    this.log(`Không thể hoàn thành nhiệm vụ: ${resourceId}`, 'warning');
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    async getTaskList(accessToken) {
        try {
            const response = await this.axios.post(this.taskListUrl, {
                resourceId: 2056
            }, {
                headers: {
                    ...this.headers,
                    "X-Growth-Token": accessToken
                }
            });

            if (response.data.code !== "000000" || !response.data.success) {
                throw new Error(`Không thể lấy danh sách nhiệm vụ: ${response.data.message}`);
            }

            const taskList = response.data.data.data[0].taskList.data;
            const resourceIds = taskList
                .filter(task => task.completedCount === 0)
                .map(task => task.resourceId);

            return resourceIds;
        } catch (error) {
            this.log(`Không thể lấy danh sách nhiệm vụ: ${error.message}`, 'error');
            return null;
        }
    }

    async completeTask(accessToken, resourceId) {
        try {
            const response = await this.axios.post(this.completeTaskUrl, {
                resourceIdList: [resourceId],
                referralCode: null
            }, {
                headers: {
                    ...this.headers,
                    "X-Growth-Token": accessToken
                }
            });

            if (response.data.code !== "000000" || !response.data.success) {
                throw new Error(`Không thể hoàn thành nhiệm vụ: ${response.data.message}`);
            }

            if (response.data.data.type) {
                this.log(`Làm nhiệm vụ ${response.data.data.type} thành công!`, 'success');
            }

            return true;
        } catch (error) {
            this.log(`Không thể hoàn thành nhiệm vụ: ${error.message}`, 'error');
            return false;
        }
    }

    async main() {
        const dataFile = path.join(__dirname, 'data.txt');
        const data = fs.readFileSync(dataFile, 'utf8')
            .replace(/\r/g, '')
            .split('\n')
            .filter(Boolean);

        const waitTime = 3600;

        while (true) {
            console.log(`Đã dùng thì đừng sợ, đã sợ thì đừng dùng...`.yellow);

            for (let i = 0; i < data.length; i++) {
                const init_data = data[i];
                const userData = JSON.parse(decodeURIComponent(init_data.split('user=')[1].split('&')[0]));
                const firstName = userData.first_name;

                console.log(`========== Tài khoản ${i + 1} | ${firstName.green} ==========`);

                const authResult = await this.authenticate(init_data);
                if (authResult) {
                    await this.completeTasks(authResult);
                    await this.playGameIfTicketsAvailable(authResult);
                }

                await this.waitWithCountdown(15);
            }

            console.log(`Tất cả các tài khoản được xử lý. Đang chờ đợi ${waitTime / 60} phút trước khi bắt đầu vòng tiếp theo...`);
            await this.waitWithCountdown(waitTime);
        }
    }
}

if (require.main === module) {
    const glados = new Moonbix();
    glados.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}