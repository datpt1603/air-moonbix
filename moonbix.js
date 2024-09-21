const fs = require('fs');
const axios = require('axios');
const colors = require('colors');
const { DateTime } = require('luxon');

class OneWin {
    constructor() {
        this.request_id = 0;
        this.authUrl = 'https://crypto-clicker-backend-go-prod.100hp.app/game/start';
        this.balanceUrl = 'https://crypto-clicker-backend-go-prod.100hp.app/user/balance';
        this.tapUrl = 'https://crypto-clicker-backend-go-prod.100hp.app/tap';
        this.upgradeUrl = 'https://crypto-clicker-backend-go-prod.100hp.app/minings';
        this.dailyUrl = 'https://crypto-clicker-backend-go-prod.100hp.app/tasks/everydayreward';
    }

    headers(token = null) {
        const headers = {
            'Accept': 'application/json, text/plain, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8,ja;q=0.7',
            'Content-Type': 'application/json',
            'Origin': 'https://cryptocklicker-frontend-rnd-prod.100hp.app',
            'Referer': 'https://cryptocklicker-frontend-rnd-prod.100hp.app/',
            'Sec-Ch-Ua': 'Chromium";v="128", "Not;A=Brand";v="24", "Microsoft Edge";v="128"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0.0.0',
            'x-user-id': `${this.request_id}`,
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    log(msg) {
        console.log(`[*] ${msg}`);
    }

    async waitWithCountdown(seconds) {
        for (let i = seconds; i >= 0; i--) {
            process.stdout.write(`\r[*] Chờ ${i} giây để tiếp tục...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        console.log('');
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async authenticate(init_data) {
        const headers = this.headers();

        const payload = {
            referrer_tg_id: '1182600866'
        }

        
    }

    async main() {
        const dataFile = 'data.txt';
        const data = fs.readFileSync(dataFile, 'utf8')
            .split('\n')
            .filter(Boolean);

        while (true) {
            for (let i = 0; i < data.length; i++) {
                const init_data = data[i].trim();
                const authResult = await this.authenticate(init_data);
            }
        }
    }
}

if (require.main === module) {
    const glados = new OneWin();
    glados.main().catch(err => {
        console.error(err);
        process.exit(1);
    });
}