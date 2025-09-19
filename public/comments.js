document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("comments-section");
  if (!container) return;

  const thread = container.dataset.thread;

  // Fetch comments
  fetch(`/comments/${thread}`)
    .then(res => res.json())
    .then(data => renderComments(container, data, thread))
    .catch(err => {
      console.error("Error loading comments", err);
      container.innerHTML = "<p>Could not load comments.</p>";
    });
});

function renderComments(container, data, thread) {
  const { roots, replies } = data;

  let html = `<h4 class="comments-count">Comments</h4>`;
  if (roots.length === 0) {
    html += `<p>No comments yet. Be the first!</p>`;
  }

  roots.forEach(c => {
    html += renderComment(c, replies[c.id] || []);
  });

  // Add form
  html += `
    <section id="comment-form" class="comment-form section">
      <form method="post" action="/comments/${thread}">
        <h4>Post Comment</h4>
        <input type="hidden" name="parent_id" id="parent_id">

        <div class="row">
          <div class="col-md-6 form-group">
            <input name="name" type="text" class="form-control" placeholder="Your Name*" required>
          </div>
          <div class="col-md-6 form-group">
            <input name="social" type="text" class="form-control" placeholder="Social link (optional)">
          </div>
        </div>

        <div class="row mt-3">
          <div class="col form-group">
            <textarea name="comment" class="form-control" placeholder="Your Comment*" rows="4" required></textarea>
          </div>
        </div>

        <div class="text-center mt-3">
          <button type="submit" class="btn btn-primary">Post Comment</button>
        </div>
      </form>
    </section>
  `;

  container.innerHTML = html;
}

function renderComment(c, replies) {
  let html = `
    <div class="comment mb-3" id="comment-${c.id}">
      <h5>
        ${c.social_url ? `<a href="${c.social_url}" target="_blank">${c.name}</a>` : c.name}
        <span class="date">${new Date(c.created_at).toLocaleString()}</span>
      </h5>
      <p>${c.text}</p>
  `;

  replies.forEach(r => {
    html += `
      <div class="comment-reply ms-4" id="comment-${r.id}">
        <h6>
          ${r.social_url ? `<a href="${r.social_url}" target="_blank">${r.name}</a>` : r.name}
          <span class="date">${new Date(r.created_at).toLocaleString()}</span>
        </h6>
        <p>${r.text}</p>
      </div>
    `;
  });

  html += `</div>`;
  return html;
}
