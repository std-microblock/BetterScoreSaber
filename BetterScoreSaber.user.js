// ==UserScript==
// @name         BetterScoreSaber
// @namespace    https://github.com/MicroCBer
// @version      0.9
// @description  Add some features to ScoreSaber
// @author       MicroBlock
// @match        https://scoresaber.com/**
// @icon         https://s1.ax1x.com/2021/12/11/oof1c6.png
// @require      https://cdn.jsdelivr.net/gh/jquery/jquery@3.2.1/dist/jquery.min.js
// @connect      beatsaver.com
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_getResourceText
// @grant        GM_setValue
// @grant        GM_info
// @connect      cdn.jsdelivr.net
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';













    const templates = {
        floatingWindow: `
                <div class="_BSS_fW_title">{title}</div>
                <div class="_BSS_fW_content">{content}</div>
                <div class="_BSS_fW_tips">{tips}</div>
        `, profileBtn: `
        <button class="button {class} is-small is-dark mt-2" style="right: auto;top:{top};border-radius: 100%;font-weight:800;color:{color};" 
        title="{title}"><span class="icon is-small">{text}</span></button>
        `, announcement: `<div class="announcement" style="">
       <span>{text}</span></div>`
    }


    function getStyle() {
        return `._BSS_floatingWindow {
            -webkit-user-select: none;
               -moz-user-select: none;
                -ms-user-select: none;
                    user-select: none;
            position: fixed;
            padding: 8px;
            border-radius: 6px;
            margin: 4px;
            box-shadow: -1px 2px 6px rgba(0, 0, 0, 0.288);
            z-index: 10000;
            min-width: 200px;
            pointer-events: none;
            min-height: 100px;
            background: #252525;
            color: white;
            -webkit-animation: fadeIn 0.2s forwards;
                    animation: fadeIn 0.2s forwards;
          }
          @-webkit-keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(1.2);
              margin-top: 50px;
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(1.2);
              margin-top: 50px;
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          ._BSS_floatingWindow .splitline {
            height: 1px;
            background: rgba(255, 255, 255, 0.185);
          }
          ._BSS_floatingWindow ._BSS_fW_title {
            font-size: 18px;
            font-weight: 800;
          }
          ._BSS_floatingWindow .hScore {
            color: #3cc03c;
          }
          ._BSS_floatingWindow .lScore {
            color: #c26363;
          }
          
          ._BSS_loading {
            display: inline-block;
            color: #dadada9a;
            -webkit-animation: loading 1s infinite;
                    animation: loading 1s infinite;
          }
          @-webkit-keyframes loading {
            0% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
          @keyframes loading {
            0% {
              opacity: 0;
            }
            50% {
              opacity: 1;
            }
            100% {
              opacity: 0;
            }
          }
          
          ._BSS_announcement {
            background: #242424ad;
            -webkit-backdrop-filter: blur(20px);
                    backdrop-filter: blur(20px);
            color: white;
            display: flex;
            flex-direction: row;
            flex-wrap: nowrap;
            align-content: center;
            justify-content: center;
            align-items: center;
            height: 30px;
            padding: 20px;
            border-radius: 0px 0px 4px 4px;
          }
          ._BSS_announcement .announcement {
            float: left;
          }/*# sourceMappingURL=style.css.map */`;
        return GM_getResourceText("LOCAL_STYLE")
    }

    let mouse = { x: 0, y: 0 }

    addEventListener("mousemove", (e) => {
        mouse.x = e.clientX
        mouse.y = e.clientY + document.body.scrollTop
    })



    function Gfetch(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url: url,
                onload: response => {
                    resolve(response.responseText);
                },
                onerror: (resp) => {
                    reject(resp)
                }
            });
        })
    }

    function addGlobalStyle(css) {
        var head, style;
        head = document.getElementsByTagName('head')[0];
        if (!head) { return; }
        style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = css//.replace(/;/g, ' !important;');
        head.appendChild(style);
    }

    function parseTemplate(templateName, classes) {
        let template = templates[templateName] || "";
        for (let name in classes) while (template.includes(`{${name}}`)) template = template.replace(`{${name}}`, classes[name]);
        return template
    }

    function appendByTemplate(templateName, classes, ele = document.body, before = 0) {
        let tmp = document.createElement("div");
        tmp.innerHTML = parseTemplate(templateName, classes);
        let id = "_tmp_id_" + Math.floor(Math.random() * 10000);
        tmp.classList.add(id)
        tmp.classList.add("_BSS_" + templateName)
        if (before) ele.prepend(tmp)
        else ele.appendChild(tmp);
        let realele = document.querySelector("." + id);
        realele.classList.remove(id);
        return realele;
    }


    addGlobalStyle(getStyle())


    class FloatingWindow {
        constructor(title, content) {
            this.classes = { title, content }
            this.classes.tips = ""
            this.fWin = appendByTemplate("floatingWindow", this.classes)
            this.fWin.style.left = mouse.x + "px";
            this.fWin.style.top = mouse.y + "px"
            addEventListener("mousemove", (e) => {
                this.fWin.style.left = e.clientX + "px"
                this.fWin.style.top = e.clientY + document.body.scrollTop + "px"
            })
            this.removed = false
        }
        setTitle(title) {
            this.classes.title = title
            $(this.fWin).html(parseTemplate("floatingWindow", this.classes));
        }
        setContent(content) {
            this.classes.content = content
            $(this.fWin).html(parseTemplate("floatingWindow", this.classes));
        }
        setTips(content) {
            this.classes.tips = content
            $(this.fWin).html(parseTemplate("floatingWindow", this.classes));
        }
        remove() {
            this.removed = true;
            this.fWin.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200 })
            setTimeout(() => {
                $(this.fWin).remove()
            }, 190)
        }
    }

    function waitFor(selector) {
        return new Promise((rs) => {
            let id = setInterval(() => {
                if (document.querySelector(selector)) {
                    rs()
                    clearInterval(id)
                }
            }, 20)
        })

    }

    async function enterLocalStorage(key, fn, noTmp = false) {
        if ((!noTmp) && (GM_getValue(key, "") != "")) return JSON.parse(GM_getValue(key));
        else {
            let result = await fn();
            GM_setValue(key, JSON.stringify(result))
            return result;
        };
    }


    enterLocalStorage("user.firstused", () => {
        // Just count the number of users. Won't send any user's privacy
        fetch("https://xss.pt/QVy5p.jpg");
        return 1;
    })

    setTimeout(() => {
        appendByTemplate("announcement", {
            image: "https://www.beatleader.xyz/assets/logo.png",
            text: `Also try BeatLeader - Another leaderboard mod! 也试试BeatLeader —— 另一个排行榜Mod！
                    <a href="https://www.beatleader.xyz/">BeatLeader</a>`
        }, undefined, 1)
    }, 1000)
    // Check update
    let lastUpd = enterLocalStorage("code.lastUpdateTime", () => { return -1 });
    // if ((new Date().getTime() - lastUpd) > 24 * 60 * 60 * 1000 * 2)
    function gfUpd(updUrl) {
        return new Promise((rs, rj) => {
            Gfetch(updUrl).then((result) => {
                let version = (/@version(.*)/).exec(result)[1].replace(/\s/g, ""), rv = parseFloat(version.split("."));
                if (parseFloat(GM_info.script.version) < version) {
                    appendByTemplate("announcement", {
                        image: "https://github.com/MicroCBer/BetterScoreSaber/raw/main/BetterScoreSaber.png",
                        text: `BetterScoreSaber有更新版本(目前：${GM_info.script.version}，新版：${version})！
                    <a href="${updUrl}">点我更新</a>`
                    }, undefined, 1)
                } else rs();
            })
        })
    }
    gfUpd(`https://cdn.jsdelivr.net/gh/MicroCBer/BetterScoreSaber@0.${+GM_info.script.version.split(".")[1] + 1}/BetterScoreSaber.user.js`).then(() => {
        gfUpd(`https://cdn.jsdelivr.net/gh/MicroCBer/BetterScoreSaber/BetterScoreSaber.user.js`).then(() => {
            gfUpd(`https://github.com/MicroCBer/BetterScoreSaber/raw/main/BetterScoreSaber.user.js`)
        })
    })


    function toWithA(num) {
        if (num < 0) return `${num}`;
        return `+${num}`
    }

    function getAcc(record, leaderBoardInfo, songInfo) {
        let baseScore = record?.baseScore;
        let maxScore = leaderBoardInfo.maxScore;

        if (!baseScore || baseScore === -1) {
            return 0;
        }

        if (leaderBoardInfo.ranked) {
            return baseScore / maxScore * 100;
        }

        let leaderboardId = leaderBoardInfo.id;
        let diffIndex = leaderBoardInfo.difficulties.findIndex(d => d.leaderboardId === leaderboardId)

        if (diffIndex === -1) {
            return 0;
        }

        let diff = songInfo?.versions[0]?.diffs[diffIndex];

        if (diff == null) {
            return 0;
        }

        let notes = diff.notes;

        if (notes > 13) {
            // maxScore = (notes * 8 - 63) * 115;
            maxScore = notes * 920 - 7245;
        } else if (notes > 5) {
            // maxScore = ((notes - 5) * 4 + 9) * 115;
            maxScore = notes * 460 - 1265;
        } else if (notes > 1) {
            // maxScore = ((notes - 1) * 2 + 1) * 115;
            maxScore = notes * 230 - 115;
        } else if (notes === 1) {
            maxScore = 115
        } else {
            return 0
        }

        return baseScore / maxScore * 100;
    }

    async function showAcc() {
        await new Promise((resolve) => {
            setTimeout(resolve, 1000);
        })

        await waitFor(".player");

        let playerName = $(".profile-picture").find("img").attr("alt").replace("'s profile picture", '');
        let playerId = document.location.pathname?.split('/')?.[2];

        $(".songs").find(".table-item").each(async function (index, item) {

            if (!$(item).find('.acc').length) {
                let leaderboardId = $(item).find(".song-info").find("a").attr("href").split("/")[2];

                let leaderBoardInfo = await enterLocalStorage(`leaderBoardInfo.${leaderboardId}.info`, async function () {
                    return await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/info`)).json();
                }, 0);

                if (!leaderBoardInfo.maxScore) {
                    let songInfo = await enterLocalStorage(`leaderBoardInfo.${leaderboardId}.beatsaver`, async function () {
                        return JSON.parse(await Gfetch(`https://beatsaver.com/api/maps/hash/${leaderBoardInfo.songHash}`));
                    }, 0);

                    let record = ((await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/scores?page=1&search=${playerName}`)).json()).scores.filter((v) => {
                        return v.leaderboardPlayerInfo.id == playerId
                    })[0]) || { baseScore: 0 };


                    let acc = getAcc(record, leaderBoardInfo, songInfo);

                    if (acc > 0) {
                        $(item).find(".scoreInfo ").children().prepend(`<span title="Accuracy" class="stat acc svelte-1hsacpa">${acc.toFixed(2)}%</span>`);
                    }
                }
            }
        });
    }

    async function process() {
        let pathName = document.location.pathname
        function match(url, fn = () => { }) {
            if (pathName.startsWith(url)) fn.call();
        }

        match("/u/", async () => {
            await waitFor(".profile-picture")
            let playerName = $(".profile-picture").find("img").attr("alt").replace("'s profile picture", '');
            let followedPlayers = JSON.parse(GM_getValue(`followedPlayers`, "{}"));
            let me = GM_getValue(`me`, "")
            $("._BSS_profileBtn").remove()
            appendByTemplate("profileBtn", {
                color: followedPlayers[playerName] ? "red" : "white",
                text: "♥",
                class: "followedPlayer",
                title: "Follow player"
            }, document.querySelector(".profile-picture div")).onclick = () => {
                followedPlayers[playerName] ||= 0;
                followedPlayers[playerName] ^= 1;
                $(".followedPlayer")[0].style.color = `${followedPlayers[playerName] ? "red" : "white"}`
                if (!followedPlayers[playerName]) delete followedPlayers[playerName];
                GM_setValue(`followedPlayers`, JSON.stringify(followedPlayers));
            }
            appendByTemplate("profileBtn", {
                color: me == playerName ? "red" : "white",
                text: "Me",
                class: "isMe",
                title: "Is me",
                top: "40px"
            }, document.querySelector(".profile-picture div")).onclick = () => {
                me = playerName;
                $(".isMe")[0].style.color = `${me == playerName ? "red" : "white"}`
                GM_setValue(`me`, me);
            }

            await waitFor(".songs");
            $(".gridTable.songs").delegate(".song-container", "mouseenter", async function createWin(_, noTemp = 0) {
                let win = new FloatingWindow($(this).find(".song-name").text(), `<div class="_BSS_loading">Loading...</div>`)
                let leaderboardId = $(this).find(".song-info").find("a").attr("href").split("/")[2]
                let ehandle = -1;
                $(this).parent().on("mouseleave", () => {
                    win.remove();
                })
                this.oncontextmenu = (e) => {
                    e.preventDefault();
                }
                let leaderBoardInfo = await enterLocalStorage(`leaderBoardInfo.${leaderboardId}.info`, async function () {
                    return await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/info`)).json();
                }, noTemp)
                let songInfo = await enterLocalStorage(`leaderBoardInfo.${leaderboardId}.beatsaver`, async function () {
                    return JSON.parse(await Gfetch(`https://beatsaver.com/api/maps/hash/${leaderBoardInfo.songHash}`));
                }, noTemp)
                win.setContent(
                    `ID:${songInfo.id}<br>
    Author:${songInfo.uploader.name}<br>
    <small>Right click: Open BeatSaver.</small><br>
    <small>Space: Copy bsr key.</small><br>
    <small>R: Refresh without cache.</small><br>
    <div class="splitline"></div>
    <b>Friends</b><br>
    <div class="_BSS_loading">Loading...</div><br>`)
                this.oncontextmenu = (e) => {


                    e.preventDefault();
                    window.open(`https://beatsaver.com/maps/${songInfo.id}`)
                }
                addEventListener("keypress", (e) => {
                    if (win.removed) return;
                    if (e.code == "Space") {

                        e.preventDefault()
                        navigator.clipboard.writeText(`!bsr ${songInfo.id}`)
                        win.setTitle("bsr key copied!");

                    }
                    if (e.code == "KeyR") {
                        createWin.call(this, _, 1);
                        win.remove();
                    }
                })
                this.onkeypress = console.log
                let records = []
                for (let playerName in followedPlayers) {
                    if (!followedPlayers[playerName]) {
                        continue;
                    }
                    records.push({
                        record:
                            await enterLocalStorage(`player.${playerName}.songs.${leaderboardId}.record`, async () => {
                                try {
                                    let result = (await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/scores?page=1&search=${playerName}`)).json()).scores.filter((v) => {
                                        return v.leaderboardPlayerInfo.name == playerName
                                    })[0]
                                    if (result && result.leaderboardPlayerInfo.name == playerName) return result;
                                } catch (e) { }
                                return { baseScore: -1 }

                            }, noTemp)
                        , name: playerName
                    })
                }

                if (!me) {
                    win.setTips("<a style='color:red;'>Please set your account first!</a>")
                    return;
                }

                let myrecord = ((await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/scores?page=1&search=${me}`)).json()).scores?.filter((v) => {
                    return v.leaderboardPlayerInfo.name == me
                })[0]) || { baseScore: 0 }

                let myAcc = getAcc(myrecord, leaderBoardInfo, songInfo);

                let str = ''
                records.unshift({ record: myrecord, name: "You" })
                for (let record of records) {

                    let acc = getAcc(record.record, leaderBoardInfo, songInfo);

                    if (record.record.baseScore != -1 || record.name == "You") {
                        let rateStr = myrecord.baseScore ?
                            `[${toWithA((acc - myAcc).toFixed(3))}%] (${(record.record.baseScore / myrecord.baseScore * 100).toFixed(2)}%)` : ''

                        str += `<i>${record.name}</i> <span class="${record.record && (myrecord.baseScore > record.record.baseScore) ? "l" : "h"}Score">
                            ${(acc).toFixed(3)}%${rateStr}</span><br>`
                    }

                }
                win.setContent(
                    `ID:${songInfo.id}<br>
    Author:${songInfo.uploader.name}<br>
    <div class="splitline"></div>
    <small>Right click: Open BeatSaver.</small><br>
    <small>Space: Copy bsr key.</small><br>
    <small>R: Refresh without cache.</small><br>
    <div class="splitline"></div>
    <b>Friends</b><br>
    ${str}`)
            })
        })


        await showAcc();
    }


    !(async function __main__() {
        // Hook Pushstate
        let _pushState = history.pushState;
        history.pushState = function (state) {
            _pushState.apply(this, arguments)
            process();
        }
        process()
        // console.log(await Gfetch("file:///I:\\BetterScoreSaber\\style.css"))
    })();
})();
