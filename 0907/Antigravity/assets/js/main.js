/**
 * main.js - 韓国観光ウェブサイト インタラクション制御スクリプト
 * jQuery & Vanilla JavaScript
 */
$(function () {
  'use strict';

  // 1. ヘッダーのスクロール監視とクラス切り替え
  var $header = $('header');
  $(window).on('scroll', function () {
    if ($(this).scrollTop() > 30) {
      $header.addClass('header-scrolled');
    } else {
      $header.removeClass('header-scrolled');
    }
  });

  // 2. モバイルナビゲーションの開閉制御
  var $mobileNav = $('#mobileNav');
  var $hamburgerBtn = $('#hamburgerBtn');

  $hamburgerBtn.on('click', function () {
    var isExpanded = $(this).attr('aria-expanded') === 'true';
    $(this).attr('aria-expanded', !isExpanded);
    $mobileNav.toggleClass('hidden');
  });

  $('#mobileNav a').on('click', function () {
    $mobileNav.addClass('hidden');
    $hamburgerBtn.attr('aria-expanded', 'false');
  });

  // 3. ページ内リンクのスムーススクロール
  $('a[href^="#"]').on('click', function (e) {
    var targetId = $(this).attr('href');
    if (targetId === '#' || targetId === '') return;

    var $target = $(targetId);
    if ($target.length) {
      e.preventDefault();
      var headerHeight = $header.outerHeight() || 72;
      $('html, body').animate(
        {
          scrollTop: $target.offset().top - headerHeight + 10
        },
        450
      );
    }
  });

  // 4. エリア・テーマ別タブフィルタリング
  $('.tab-trigger').on('click', function () {
    var category = $(this).data('category');

    $('.tab-trigger').removeClass('active');
    $(this).addClass('active');

    if (category === 'all') {
      $('.destination-item').fadeIn(250);
    } else {
      $('.destination-item').each(function () {
        if ($(this).data('category') === category) {
          $(this).fadeIn(250);
        } else {
          $(this).fadeOut(150);
        }
      });
    }
  });

  // 5. よくある質問 (FAQ) アコーディオン制御
  $('.faq-header').on('click', function () {
    var $item = $(this).closest('.faq-item');
    var $content = $item.find('.faq-content');

    if ($item.hasClass('active')) {
      $content.slideUp(200);
      $item.removeClass('active');
    } else {
      $('.faq-item').removeClass('active');
      $('.faq-content').slideUp(200);
      $content.slideDown(200);
      $item.addClass('active');
    }
  });

  // 6. 旅行相談・ニュースレター送信フィードバック
  $('#inquiryForm').on('submit', function (e) {
    e.preventDefault();
    var $feedback = $('#formFeedback');
    $feedback.removeClass('hidden').text('お問い合わせを受け付けました。ご入力のメールアドレス宛にご案内をお送りいたします。');
    this.reset();

    setTimeout(function () {
      $feedback.addClass('hidden');
    }, 5000);
  });
});
