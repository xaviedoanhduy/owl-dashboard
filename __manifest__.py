{
    "name": "Owl Dashboard",
    "version": "17.0.1.0.0",
    "summary": """Owl Dashboard Tutorial""",
    "description": """Owl Dashboard Tutorial using Owl framework""",
    "category": "product",
    "author": "Duy Do Anh",
    "company": "Trobz Consulting",
    "maintainer": "Duy Do Anh",
    "sequence": 1,
    "depends": [
        "base",
        "web",
        "sale",
        "crm",
        "board",
        "spreadsheet_dashboard",
    ],
    "website": "https://github.com/xaviedoanhduy",
    "data": [
        "views/sale_views.xml",
        "views/sale_action_views.xml",
        "views/menu_views.xml",
    ],
    "images": ["/static/src/description/icon.png"],
    "installable": True,
    "auto_install": False,
    "application": True,
    "assets": {
        "web.assets_backend": [
            "owl_dashboard/static/src/components/**/*.js",
            "owl_dashboard/static/src/components/**/*.xml",
            "owl_dashboard/static/src/components/**/*.scss",
        ]
    }
}
