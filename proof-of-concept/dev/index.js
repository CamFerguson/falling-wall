var articles;
var audio = new Audio('./media/woo.mp3');
var infos = {};

$(document).ready(() => {
    load_data();
});

$(window).on('load', () => {
    //var svgG = $(document).find('g').get(0);
    var svgG = document.getElementById('root');
    // tells the library to not 'preventDefault' so we can handle it
    // onTouch: function (e) {return false;}
	  var instance = panzoom(svgG, {
        smoothScroll: false,
        zoomSpeed: 0.050,
        pinchSpeed: 0.5,
        bounds: true
    });
    instance.zoomAbs(
        $(window).width()/2,
        $(window).height()/2,
        0.33
    );
    $('#scene').click(wall_click(instance));
});

function svg_a_click(e) {
    // inspired/written by @demp

    e.preventDefault();
    e.stopPropagation();
    var a = $(e.target);
    if (a[0].tagName != 'a')
        a = a.parents('a');
    a = a[0];
    if ('title' in a &&
        a.title in infos) {
        var html_data = infos[a.title].html;
        $('.info-text').html(html_data);
        $('.info-link').attr("href", infos[a.title].url);
        MathJax.typeset();
    }
    return false;
}

function load_data () {
    // written by @demp

    var svgc = document.querySelector('svg');
    [...svgc.querySelectorAll('a')].forEach(
        anchor => {
            anchor.addEventListener('click', svg_a_click);
            anchor.addEventListener('touchstart', svg_a_click);
            anchor.title = anchor.getAttributeNS(
                'http://www.w3.org/1999/xlink',
                'title'
            );
            anchor.href = anchor.getAttributeNS(
                'http://www.w3.org/1999/xlink',
                'href'
            );
        });

    articles = [...$(svgc).find("a[*|title]").map(
        (i, el) => {
            return [[
                el.title,
                el.href,
                el
            ]];
        })]
        .reduce(
            (articles, t) => {
                articles[t[0]] = {url: t[1], node: t[2]};
                return articles;
            }, {});


    let titles = [...new Set(Object.values(articles).map(
        tdata =>
            decodeURIComponent(
                tdata.url.baseVal
                    .split('/')
                    .pop()
                    .replace(/\+/g, ' ')
                    .replace(/_/g, ' ')
            )
    ))];



    for (let i = 0, j = titles.length; i < j; i += 50) {
        var temp_titles = titles.slice(i, i + 50).join('|');
        console.log(temp_titles);
        $.ajax({
            url: 'https://theportal.wiki/api.php',
            jsonp: 'callback',
            dataType: 'jsonp',
            data: {
                action: 'query',
                format: 'json',
                prop: 'extracts|info',
                list: '',
                titles: temp_titles,
                utf8: '1',
                exintro: '1',
                exsectionformat: 'wiki',
                inprop: 'url',
            },
            success: function(response) {
                for (let k in response.query.pages) {
                    let pdata = response.query.pages[k];
                    article = Object.values(articles).filter(
                        article => article.url.baseVal.replace('http:', 'https:') == pdata.fullurl.replace('http:', 'https:'));
                    if (article) {
                        article[0].html = pdata.extract;
                    }
                }
                for (let title in articles) {
                    var extracted_text = "cant load information";
                    let article = articles[title];
                    if (article.html) {
                        extracted_text = article.html;
                    } else {
                        console.log('html fetch fail')
                    }
                    infos[title] = {
                        'html': extracted_text,
                        'url': article.url.baseVal,
                    };
                }
            }
        });
    }
};

function wall_click(instance) {
    return () => {
    var wall = $('#wall');
    var svg = $(document).find('g').get(0);
    var wobble_in_duration = 350;
    var wobble_out_duration = 600;
    var fall_inward_duration = 650;
    var scene_fade_out_duration = 1500;
    var info_box_fade_in_duration = 1500;
    var new_wall_spawn_delay = 100;

        wall
        // wobble old wall into screen
            .queue(function(next) {
                wall.css('transition-duration', wobble_in_duration+'ms');
                wall.addClass('wobble-in',);
                next();
            })
            .delay(wobble_in_duration+10)

        // wobble old wall out of screen
            .queue(function(next) {
                wall.css('transition-duration', wobble_out_duration+'ms');
                wall.addClass('wobble-out');
                wall.removeClass('wobble-in');
                next();
            })
            .delay(wobble_out_duration+10)

        // knock over old wall inward
            .queue(function(next) {
                wall.css('transition-duration', fall_inward_duration+'ms');
                wall.css(
                    "transition-timing-function",
                    "cubic-bezier(.53,.07,.74,.35)");
                wall.addClass('fallen');
                wall.removeClass('wobble-out');
                next();
            })
            .delay(fall_inward_duration)

        // swap old wall texture to shattered version
            .queue(function(next) {
                $('#texture-broken').css('display', 'block');
                $('#texture').hide();
                audio.play();
                next();
            })
        .delay(new_wall_spawn_delay)

        // spawn new wall
            .queue(function(next) {
                // smoothZoom takes in (x,y,scale)
                instance.smoothZoom(
                    $(window).width()/2,
                    $(window).height()/2 + $(window).height()/2,
                    1.3 // scale by this factor
                );
                $('#new-wall').css('opacity', '1.0');
                $('#new-wall').css('z-index', '1');
                next();
            })

        // fade out old wall
            .queue(function(next) {
                $('#scene').css('transition-duration', scene_fade_out_duration + 'ms');
                $('#scene').css('opacity', '0.0');
                next();
            })
            .delay(scene_fade_out_duration)

        // remove out old wall
            .queue(function(next) {
                $('#scene').remove();
                $('.info-box').css(
                    'transition',
                    'visibility 0s;');
                $('.info-box').css('transition-duration',
                                   info_box_fade_in_duration + 'ms' );
                $('.info-box').css('visibility', 'visible');
                $('.info-box').css('opacity', '1.0');
                $('.info-link').css('transition-duration', '250ms' );
                next();
            });
    };
};
