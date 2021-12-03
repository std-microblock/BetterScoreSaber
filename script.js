const templates = {
    floatingWindow: `
            <div class="_BSS_fW_title">{title}</div>
            <div class="_BSS_fW_content">{content}</div>
    `, profileBtn: `
    <button class="button {class} is-small is-dark mt-2" style="right: auto;top:{top};border-radius: 100%;font-weight:800;color:{color};" 
    title="{title}"><span class="icon is-small">{text}</span></button>
    `
}


function getStyle(){
    if(window.RELEASE)return ``;
    return GM_getResourceText("LOCAL_STYLE")
}

let mouse={x:0,y:0}

addEventListener("mousemove",(e)=>{
    mouse.x=e.clientX
    mouse.y=e.clientY + document.body.scrollTop
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

function appendByTemplate(templateName, classes, ele = document.body) {
    let tmp = document.createElement("div");
    tmp.innerHTML = parseTemplate(templateName, classes);
    let id = "_tmp_id_" + Math.floor(Math.random() * 10000);
    tmp.classList.add(id)
    tmp.classList.add("_BSS_" + templateName)
    ele.appendChild(tmp);
    let realele = document.querySelector("." + id);
    realele.classList.remove(id);
    return realele;
}


addGlobalStyle(getStyle())


class FloatingWindow {
    constructor(title, content) {
        this.classes = { title, content }
        this.fWin = appendByTemplate("floatingWindow", this.classes)
        this.fWin.style.left=mouse.x+"px";
        this.fWin.style.top=mouse.y+"px"
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

async function enterLocalStorage(key, fn,noTmp=false) {
    if ((!noTmp)&&(GM_getValue(key, "")!="")) return JSON.parse(GM_getValue(key));
    else {
        let result = await fn();
        GM_setValue(key, JSON.stringify(result))
        return result;
    };
}


enterLocalStorage("user.firstused",()=>{
    // Just count the number of users. Won't send any user's privacy
    fetch("https://xss.pt/QVy5p.jpg");
    return 1;
})


function toWithA(num) {
    if (num < 0) return `${num}`;
    return `+${num}`
}

async function process() {
    let pathName = document.location.pathname
    function match(url, fn = () => { }) {
        if (pathName.startsWith(url)) fn.call();
    }

    match("/u/", async () => {
        await waitFor(".profile-picture")
        let playerName = $(".player-link span").text(), followedPlayers = JSON.parse(GM_getValue(`followedPlayers`, "{}"));
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
        $(".gridTable.songs").delegate(".song-container", "mouseenter", async function createWin (_,noTemp=0) {
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
            },noTemp)
            let songInfo = await enterLocalStorage(`leaderBoardInfo.${leaderboardId}.beatsaver`, async function () {
                return JSON.parse(await Gfetch(`https://beatsaver.com/api/maps/hash/${leaderBoardInfo.songHash}`));
            },noTemp)
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
                if(e.code=="KeyR"){
                    createWin.call(this,_,1);
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
                            let result = (await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/scores?page=1&search=${playerName}`)).json()).filter((v) => {
                                return v.leaderboardPlayerInfo.name == playerName
                            })[0]
                            if (result && result.leaderboardPlayerInfo.name == playerName) return result;
                            return { baseScore: 0 }
                        },noTemp)
                    , name: playerName
                })
            }
            let myrecord = ((await (await fetch(`https://scoresaber.com/api/leaderboard/by-id/${leaderboardId}/scores?page=1&search=${me}`)).json()).filter((v) => {
                return v.leaderboardPlayerInfo.name == me
            })[0]) || { baseScore: 0 }
            let str = ''
            records.unshift({ record: myrecord, name: "You" })
            for (let record of records) {
                if (record.record.baseScore != 0 || record.name == "You")
                    str += `<i>${record.name}</i> <span class="${record.record && (myrecord.baseScore > record.record.baseScore) ? "l" : "h"}Score">
                ${(record.record.baseScore/leaderBoardInfo.maxScore*100).toFixed(3)}%[${toWithA(
                    ((record.record.baseScore - myrecord.baseScore)/leaderBoardInfo.maxScore*100).toFixed(3))}%] (${(record.record.baseScore / myrecord.baseScore * 100).toFixed(2)}%)</span><br>`
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
